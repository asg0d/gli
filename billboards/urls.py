from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillboardViewSet, EmployeeViewSet

router = DefaultRouter()
router.register(r'billboards', BillboardViewSet)
router.register(r'employees', EmployeeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
