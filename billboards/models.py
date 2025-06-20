from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Employee(models.Model):
    """Модель сотрудника, ответственного за билборд"""
    first_name = models.CharField('Имя', max_length=100)
    last_name = models.CharField('Фамилия', max_length=100)
    email = models.EmailField('Email', unique=True)
    phone = models.CharField('Телефон', max_length=20, blank=True)
    position = models.CharField('Должность', max_length=100, blank=True)
    is_active = models.BooleanField('Активен', default=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)

    class Meta:
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Category(models.Model):
    """Модель категории рекламных конструкций"""
    name = models.CharField('Название', max_length=100, unique=True)
    slug = models.SlugField('Слаг', max_length=100, unique=True, help_text='Используется в URL и API')
    description = models.TextField('Описание', blank=True)
    icon = models.CharField('Иконка', max_length=50, blank=True, help_text='Название иконки (например: monitor, bus)')
    color = models.CharField('Цвет', max_length=7, default='#3b82f6', help_text='Цвет в формате HEX (#3b82f6)')
    is_active = models.BooleanField('Активна', default=True)
    order = models.PositiveIntegerField('Порядок сортировки', default=0)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    @property
    def billboards_count(self):
        """Количество билбордов в категории"""
        return self.billboards.count()

class Contractor(models.Model):
    """Модель контрагента (клиента)"""
    name = models.CharField('Название компании', max_length=200)
    contact_person = models.CharField('Контактное лицо', max_length=150, blank=True)
    phone = models.CharField('Телефон', max_length=20, blank=True)
    email = models.EmailField('Email', blank=True)
    address = models.TextField('Адрес', blank=True)
    contract_number = models.CharField('Номер договора', max_length=50, blank=True)
    inn = models.CharField('ИНН', max_length=20, blank=True, help_text='Идентификационный номер налогоплательщика')
    website = models.URLField('Веб-сайт', blank=True)
    notes = models.TextField('Заметки', blank=True)
    is_active = models.BooleanField('Активен', default=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Контрагент'
        verbose_name_plural = 'Контрагенты'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def billboards_count(self):
        """Количество билбордов контрагента"""
        return self.billboards.count()

    @property
    def display_contact(self):
        """Отображение контактной информации"""
        contact_parts = []
        if self.contact_person:
            contact_parts.append(self.contact_person)
        if self.phone:
            contact_parts.append(self.phone)
        return ' • '.join(contact_parts) if contact_parts else 'Не указано'

class Billboard(models.Model):
    """Модель билборда"""
    
    STATUS_CHOICES = [
        ('active', 'Активен'),
        ('pending', 'Ожидание'),
        ('expired', 'Истёк'),
        ('maintenance', 'Обслуживание'),
    ]

    # Основная информация
    title = models.CharField('Название', max_length=200, help_text='Краткое название билборда')
    description = models.TextField('Описание', blank=True, help_text='Подробное описание')
    
    # Категория (ForeignKey)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        verbose_name='Категория',
        related_name='billboards',
        help_text='Тип рекламной конструкции',
        blank=True,
        null=True,
    )
    
    # Контрагент (клиент)
    contractor = models.ForeignKey(
        Contractor,
        on_delete=models.CASCADE,
        verbose_name='Контрагент',
        related_name='billboards',
        help_text='Клиент, арендующий рекламную конструкцию',
        blank=True,
        null=True,
    )
    
    # Ответственный сотрудник
    employee = models.ForeignKey(
        Employee, 
        on_delete=models.CASCADE, 
        verbose_name='Ответственный сотрудник',
        related_name='billboards'
    )
    
    # Размеры (поменяли местами ширину и высоту)
    width = models.DecimalField(
        'Ширина (м)', 
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0.1)]
    )
    height = models.DecimalField(
        'Высота (м)', 
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0.1)]
    )
    
    # Адрес и координаты
    address = models.TextField('Адрес')
    latitude = models.DecimalField(
        'Широта', 
        max_digits=10, 
        decimal_places=7,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        'Долгота', 
        max_digits=10, 
        decimal_places=7,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    
    # Период аренды
    start_date = models.DateField('Дата начала аренды')
    end_date = models.DateField('Дата окончания аренды')
    
    # Статус
    status = models.CharField(
        'Статус', 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    
    # Дополнительная информация
    price = models.DecimalField(
        'Стоимость аренды (сум)', 
        max_digits=12, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    notes = models.TextField('Заметки', blank=True)
    
    # Системные поля
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Билборд'
        verbose_name_plural = 'Билборды'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.category.name} #{self.id} - {self.title}"

    @property
    def size_display(self):
        """Отображение размера в формате 'ШxВ м'"""
        return f"{self.height}x{self.width} м"

    @property
    def period_display(self):
        """Отображение периода аренды"""
        return f"{self.start_date.strftime('%d.%m.%Y')} – {self.end_date.strftime('%d.%m.%Y')}"

    @property
    def is_expired(self):
        """Проверка, истёк ли срок аренды"""
        return self.end_date < timezone.now().date()

    @property
    def days_until_expiry(self):
        if self.end_date is None:
            return None  # или 0, или timedelta(0), в зависимости от логики
        return self.end_date - timezone.now().date()

def billboard_image_upload_path(instance, filename):
    """Путь для загрузки изображений билбордов"""
    return f'billboards/{instance.billboard.id}/{filename}'

class BillboardImage(models.Model):
    """Модель изображений билборда"""
    billboard = models.ForeignKey(
        Billboard, 
        on_delete=models.CASCADE, 
        related_name='images',
        verbose_name='Билборд'
    )
    image = models.ImageField(
        'Изображение', 
        upload_to=billboard_image_upload_path,
        help_text='Рекомендуемый размер: 800x600px'
    )
    alt_text = models.CharField('Альтернативный текст', max_length=200, blank=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    is_primary = models.BooleanField('Основное изображение', default=False)
    uploaded_at = models.DateTimeField('Дата загрузки', auto_now_add=True)

    class Meta:
        verbose_name = 'Изображение билборда'
        verbose_name_plural = 'Изображения билбордов'
        ordering = ['order', '-uploaded_at']

    def __str__(self):
        return f"Изображение для {self.billboard.title}"

    def save(self, *args, **kwargs):
        # Если это основное изображение, убираем флаг у других
        if self.is_primary:
            BillboardImage.objects.filter(
                billboard=self.billboard, 
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
