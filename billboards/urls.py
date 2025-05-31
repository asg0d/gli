from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillboardViewSet, EmployeeViewSet, CategoryViewSet, ContractorViewSet

router = DefaultRouter()
router.register(r'billboards', BillboardViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'contractors', ContractorViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
