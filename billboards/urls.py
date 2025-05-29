from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillboardViewSet, EmployeeViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'billboards', BillboardViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
