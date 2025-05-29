from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import Billboard, Employee, Category
from .serializers import (
    BillboardSerializer,
    BillboardListSerializer,
    EmployeeSerializer,
    CategorySerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


class BillboardViewSet(viewsets.ModelViewSet):
    queryset = (
        Billboard.objects.all()
        .select_related("employee", "category")
        .prefetch_related("images")
    )

    def get_serializer_class(self):
        if self.action == "list":
            return BillboardListSerializer
        return BillboardSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Фильтрация по категории (по slug или id)
        category = self.request.query_params.get("category", None)
        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=category)
            else:
                queryset = queryset.filter(category__slug=category)

        # Фильтрация по статусу
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Фильтрация по сотруднику
        employee_id = self.request.query_params.get("employee", None)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        # Поиск по адресу или названию
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(address__icontains=search)
                | Q(employee__first_name__icontains=search)
                | Q(employee__last_name__icontains=search)
                | Q(category__name__icontains=search)
            )

        return queryset

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Получение статистики по билбордам"""
        queryset = self.get_queryset()

        # Общая статистика
        total = queryset.count()
        active = queryset.filter(status="active").count()
        pending = queryset.filter(status="pending").count()
        expired = queryset.filter(status="expired").count()
        maintenance = queryset.filter(status="maintenance").count()

        # Статистика по категориям
        categories_stats = {}
        for category in Category.objects.filter(is_active=True):
            categories_stats[category.slug] = queryset.filter(category=category).count()

        return Response(
            {
                "total": total,
                "active": active,
                "pending": pending,
                "expired": expired,
                "maintenance": maintenance,
                "categories": categories_stats,
            }
        )

    @action(detail=False, methods=["get"])
    def expiring_soon(self, request):
        """Билборды, срок аренды которых истекает в ближайшие 30 дней"""
        from django.utils import timezone
        from datetime import timedelta

        thirty_days_from_now = timezone.now().date() + timedelta(days=30)
        expiring = self.get_queryset().filter(
            end_date__lte=thirty_days_from_now,
            end_date__gte=timezone.now().date(),
            status="active",
        )

        serializer = self.get_serializer(expiring, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_category(self, request):
        """Получение билбордов по категориям"""
        category = request.query_params.get("category")
        if not category:
            return Response({"error": "Category parameter is required"}, status=400)

        if category.isdigit():
            queryset = self.get_queryset().filter(category_id=category)
        else:
            queryset = self.get_queryset().filter(category__slug=category)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class EmployeeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Employee.objects.filter(is_active=True)
    serializer_class = EmployeeSerializer
