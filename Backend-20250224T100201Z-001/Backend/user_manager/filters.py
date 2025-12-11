from django.db.models import Q
from django_filters import rest_framework as filters
from user_manager.models import User

class UserFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    status = filters.CharFilter(method='filter_status')

    class Meta:
        model = User
        fields = []

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(name__icontains=value) |
            Q(email__icontains=value) |
            Q(phone_number__icontains=value) |
            Q(role__name__icontains=value)  # ✅ keep only this one for role
        ).distinct()

    def filter_status(self, queryset, name, value):
        value = value.lower()
        if value == 'active':
            return queryset.filter(is_active=True)
        elif value == 'inactive':
            return queryset.filter(is_active=False)
        return queryset
