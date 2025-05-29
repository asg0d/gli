from rest_framework import serializers
from .models import Billboard, BillboardImage, Employee, Category


class CategorySerializer(serializers.ModelSerializer):
    billboards_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "color",
            "is_active",
            "order",
            "billboards_count",
        ]


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "position",
        ]


class BillboardImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillboardImage
        fields = ["id", "image", "alt_text", "order", "is_primary"]


class BillboardSerializer(serializers.ModelSerializer):
    images = BillboardImageSerializer(many=True, read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    size = serializers.CharField(source="size_display", read_only=True)
    period = serializers.CharField(source="period_display", read_only=True)
    location = serializers.SerializerMethodField()
    days_until_expiry = serializers.ReadOnlyField()
    category_data = CategorySerializer(source="category", read_only=True)

    class Meta:
        model = Billboard
        fields = [
            "id",
            "title",
            "description",
            "category",
            "category_data",
            "employee",
            "employee_name",
            "width",
            "height",
            "size",
            "address",
            "latitude",
            "longitude",
            "location",
            "start_date",
            "end_date",
            "period",
            "status",
            "price",
            "notes",
            "images",
            "days_until_expiry",
            "created_at",
            "updated_at",
        ]

    def get_location(self, obj):
        return {"lat": float(obj.latitude), "lng": float(obj.longitude)}


class BillboardListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка билбордов"""

    images = serializers.SerializerMethodField()
    employee = serializers.CharField(source="employee.full_name", read_only=True)
    size = serializers.CharField(source="size_display", read_only=True)
    period = serializers.CharField(source="period_display", read_only=True)
    location = serializers.SerializerMethodField()
    category_data = CategorySerializer(source="category", read_only=True)

    class Meta:
        model = Billboard
        fields = [
            "id",
            "title",
            "category",
            "category_data",
            "images",
            "employee",
            "size",
            "address",
            "location",
            "period",
            "status",
        ]

    def get_images(self, obj):
        # Возвращаем только URL изображений для фронтенда
        images = obj.images.all()[:2]  # Максимум 2 изображения
        request = self.context.get("request")
        if request:
            return [request.build_absolute_uri(img.image.url) for img in images]
        return [img.image.url for img in images]

    def get_location(self, obj):
        return {"lat": float(obj.latitude), "lng": float(obj.longitude)}
