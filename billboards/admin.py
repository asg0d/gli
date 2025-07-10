from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Contractor, Employee, Category, Billboard, BillboardImage


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "email",
        "phone",
        "position",
        "billboards_count",
        "is_active",
    ]
    list_filter = ["is_active", "position", "created_at"]
    search_fields = ["first_name", "last_name", "email"]
    readonly_fields = ["created_at"]

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("first_name", "last_name", "email", "phone")},
        ),
        ("Рабочая информация", {"fields": ("position", "is_active")}),
        ("Системная информация", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    def billboards_count(self, obj):
        count = obj.billboards.count()
        if count > 0:
            url = (
                reverse("admin:billboards_billboard_changelist")
                + f"?employee__id__exact={obj.id}"
            )
            return format_html('<a href="{}">{} билбордов</a>', url, count)
        return "0 билбордов"

    billboards_count.short_description = "Количество билбордов"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "color_preview",
        "icon",
        "billboards_count",
        "is_active",
        "order",
    ]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "slug", "description"]
    readonly_fields = ["created_at", "updated_at", "billboards_count"]
    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        ("Основная информация", {"fields": ("name", "slug", "description")}),
        ("Внешний вид", {"fields": ("icon", "color", "order")}),
        ("Настройки", {"fields": ("is_active",)}),
        ("Статистика", {"fields": ("billboards_count",), "classes": ("collapse",)}),
        (
            "Системная информация",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def color_preview(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; border-radius: 3px;"></div>',
            obj.color,
        )

    color_preview.short_description = "Цвет"

    def billboards_count(self, obj):
        count = obj.billboards_count
        if count > 0:
            url = (
                reverse("admin:billboards_billboard_changelist")
                + f"?category__id__exact={obj.id}"
            )
            return format_html('<a href="{}">{} билбордов</a>', url, count)
        return "0 билбордов"

    billboards_count.short_description = "Количество билбордов"


@admin.register(Contractor)
class ContractorAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "contact_person",
        "phone",
        "email",
        "contract_number",
        "billboards_count",
        "is_active",
    ]
    list_filter = ["is_active", "created_at"]
    search_fields = [
        "name",
        "contact_person",
        "phone",
        "email",
        "contract_number",
        "inn",
    ]
    readonly_fields = ["created_at", "updated_at", "billboards_count"]

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("name", "contact_person", "phone", "email")},
        ),
        ("Адрес и контакты", {"fields": ("address", "website")}),
        ("Документы", {"fields": ("contract_number", "inn")}),
        ("Дополнительно", {"fields": ("notes", "is_active")}),
        ("Статистика", {"fields": ("billboards_count",), "classes": ("collapse",)}),
        (
            "Системная информация",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def billboards_count(self, obj):
        count = obj.billboards_count
        if count > 0:
            url = (
                reverse("admin:billboards_billboard_changelist")
                + f"?contractor__id__exact={obj.id}"
            )
            return format_html('<a href="{}">{} билбордов</a>', url, count)
        return "0 билбордов"

    billboards_count.short_description = "Количество билбордов"


class BillboardImageInline(admin.TabularInline):
    model = BillboardImage
    extra = 1
    fields = ["image", "alt_text", "order", "is_primary", "image_preview"]
    readonly_fields = ["image_preview"]

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px;" />',
                obj.image.url,
            )
        return "Нет изображения"

    image_preview.short_description = "Превью"


@admin.register(Billboard)
class BillboardAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "category_badge",
        "contractor_info",
        "employee",
        "size_display",
        "status_badge",
        "period_display",
        "days_left",
        "created_at",
    ]
    list_filter = [
        "category",
        "status",
        "employee",
        "contractor",
        "created_at",
        "start_date",
        "end_date",
    ]
    search_fields = [
        "title",
        "address",
        "employee__first_name",
        "employee__last_name",
        "category__name",
        "contractor__name",
    ]
    readonly_fields = ["created_at", "updated_at", "days_until_expiry"]
    inlines = [BillboardImageInline]

    fieldsets = (
        (
            "Основная информация",
            {
                "fields": (
                    "title",
                    "description",
                    "category",
                    "contractor",
                    "employee",
                    "status",
                )
            },
        ),
        (
            "Размеры и расположение",
            {"fields": ("width", "height", "address", "latitude", "longitude")},
        ),
        ("Период аренды", {"fields": ("start_date", "end_date", "days_until_expiry")}),
        ("Финансовая информация", {"fields": ("price",), "classes": ("collapse",)}),
        ("Дополнительно", {"fields": ("notes",), "classes": ("collapse",)}),
        (
            "Системная информация",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def category_badge(self, obj):
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            obj.category.color,
            obj.category.name,
        )

    category_badge.short_description = "Категория"

    def contractor_info(self, obj):
        if obj.contractor:
            return format_html(
                "<div><strong>{}</strong><br><small>{}</small></div>",
                obj.contractor.name,
                obj.contractor.display_contact,
            )
        return format_html("<span style='color: #888;'>Нет подрядчика</span>")

    contractor_info.short_description = "Контрагент"

    def status_badge(self, obj):
        colors = {
            "active": "#28a745",
            "pending": "#ffc107",
            "expired": "#dc3545",
            "maintenance": "#6c757d",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Статус"

    def days_left(self, obj):
        delta = obj.days_until_expiry
        days = delta.days if delta else 0
        if days <= 0:
            return format_html('<span style="color: red; font-weight: bold;">Истёк</span>')
        elif days <= 7:
            return format_html('<span style="color: orange; font-weight: bold;">{} дней</span>', days)
        elif days <= 30:
            return format_html('<span style="color: #ffc107; font-weight: bold;">{} дней</span>', days)
        else:
            return format_html('<span style="color: green;">{} дней</span>', days)

    days_left.short_description = "Осталось дней"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("employee", "category", "contractor")
        )


@admin.register(BillboardImage)
class BillboardImageAdmin(admin.ModelAdmin):
    list_display = [
        "billboard",
        "image_preview",
        "alt_text",
        "is_primary",
        "order",
        "uploaded_at",
    ]
    list_filter = [
        "is_primary",
        "uploaded_at",
        "billboard__status",
        "billboard__category",
    ]
    search_fields = ["billboard__title", "alt_text"]
    readonly_fields = ["uploaded_at", "image_preview"]

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px;" />',
                obj.image.url,
            )
        return "Нет изображения"

    image_preview.short_description = "Превью"


# Кастомизация админ-панели
admin.site.site_header = "Билборды Live - Панель управления"
admin.site.site_title = "Билборды Live"
admin.site.index_title = "Добро пожаловать в панель управления билбордами"
