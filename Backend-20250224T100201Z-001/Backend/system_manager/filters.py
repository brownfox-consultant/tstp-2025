from django.db.models import Q
from django_filters import rest_framework as filters

from system_manager.models import Doubt, Issue, StudentFeedback,Concern,Meeting 
from system_manager.models import Suggestion


class SuggestionFilter(filters.FilterSet):
    course = filters.CharFilter(method='filter_course')
    created_by = filters.CharFilter(method='filter_created_by')
    status = filters.CharFilter(method='filter_status')
    difficulty = filters.CharFilter(method='filter_difficulty')  # ✅ NEW
    created_date = filters.DateFromToRangeFilter(field_name='created_at')
    question_text = filters.CharFilter(field_name='question__description', lookup_expr='icontains')

    class Meta:
        model = Suggestion
        fields = [
            'course',
            'created_by',
            'status',
            'difficulty',  # ✅ include here too
            'created_date',
            'question_text',
        ]

    def filter_course(self, queryset, name, value):
        values = value.split(",")
        return queryset.filter(
            question__course_subject__course__id__in=values
        )


    def filter_created_by(self, queryset, name, value):
        names = value.split(',')
        return queryset.filter(created_by__name__in=names)

    def filter_status(self, queryset, name, value):
        statuses = value.split(',')
        return queryset.filter(status__in=statuses)

    def filter_difficulty(self, queryset, name, value):
        difficulties = value.split(',')
        return queryset.filter(question__difficulty__in=difficulties)  # ✅ assumes question has difficulty field



class MeetingFilter(filters.FilterSet):
    ordering = filters.OrderingFilter(
        fields=[
        ('description', 'description'),
        ('requested_by__name', 'requested_by__name'),
        ('requested_by__email', 'requested_by__email'),
        ('requested_by__phone_number', 'requested_by__phone_number'),
        ('status', 'status'),
        ('requested_time', 'requested_time'),
        ('approved_time', 'approved_time'),
        ]
    )

    class Meta:
        model = Meeting
        fields = []



class ConcernFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    ordering = filters.OrderingFilter(
        fields=(
            ('description', 'description'),
            ('status', 'status'),
            ('created_at', 'created_at'),
            ('resolution_date', 'resolution_date'),
            ('parent__name', 'parent'),
        )
    )

    class Meta:
        model = Concern
        fields = []

    def filter_search(self, queryset, name, value):
        query = Q(description__icontains=value) | Q(status__icontains=value)
        return queryset.filter(query)




class DoubtFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')  # Universal search
    ordering = filters.OrderingFilter(
        fields=(
            ('description', 'description'),
            ('status', 'status'),
            ('created_at', 'created_at'),  # Sorting by created date
            ('resolution_date', 'resolution_date'),  # Sorting by resolution date
            ('student__name', 'student'),
            ('faculty_assigned_date', 'faculty_assigned_date'),
            ('resolved_by__name', 'resolved_by'),
        )
    )

    class Meta:
        model = Doubt
        fields = []

    def filter_search(self, queryset, name, value):
        from datetime import datetime

        # Universal search for description and status
        query = Q(description__icontains=value) | Q(status__icontains=value) | Q(resolved_by__name__icontains=value)

        # List of potential date formats to try parsing
        date_formats = [
            '%b %d, %Y',  # Format: 'Nov 10, 2023'
            '%b %d %Y',  # Format: 'Nov 10 2023'
            '%b %d',  # Format: 'Nov 10'
            '%b %Y',  # Format: 'Nov 2023'
            '%d %Y',  # Format: '10 2023'
            '%Y',  # Format: '2023'
            '%b',  # Format: 'Nov'
            '%d',  # Format: '10'
        ]

        for date_format in date_formats:
            try:
                # Attempt to parse the provided value with one of the formats
                parsed_date = datetime.strptime(value, date_format)

                # Apply year, month, and day-based filtering for created_at and resolution_date
                if date_format == '%Y':
                    query |= Q(created_at__year=parsed_date.year) | Q(resolution_date__year=parsed_date.year)
                elif date_format in ['%b %d, %Y', '%b %d %Y']:
                    query |= Q(created_at__date=parsed_date.date()) | Q(resolution_date__date=parsed_date.date())
                elif date_format == '%b %d':
                    query |= Q(created_at__month=parsed_date.month, created_at__day=parsed_date.day) | \
                             Q(resolution_date__month=parsed_date.month, resolution_date__day=parsed_date.day)
                elif date_format == '%b %Y':
                    query |= Q(created_at__month=parsed_date.month, created_at__year=parsed_date.year) | \
                             Q(resolution_date__month=parsed_date.month, resolution_date__year=parsed_date.year)
                elif date_format == '%d %Y':
                    query |= Q(created_at__day=parsed_date.day, created_at__year=parsed_date.year) | \
                             Q(resolution_date__day=parsed_date.day, resolution_date__year=parsed_date.year)
                elif date_format == '%b':
                    query |= Q(created_at__month=parsed_date.month) | Q(resolution_date__month=parsed_date.month)
                elif date_format == '%d':  # Specifically handle day-only queries
                    query |= Q(created_at__day=parsed_date.day) | Q(resolution_date__day=parsed_date.day)
                break  # If parsing succeeds, break out of the loop
            except ValueError:
                # If parsing fails, continue trying other formats
                continue

        # Apply the filtered query to the queryset
        return queryset.filter(query)


class IssueFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')  # Universal search
    ordering = filters.OrderingFilter(
        fields=(
            ('description', 'description'),
            ('status', 'status'),
            ('created_at', 'created_at'),
            ('resolution_date', 'resolution_date'),
            ('student__name', 'student'),
            ('resolved_by__name', 'resolved_by'),
        )
    )

    class Meta:
        model = Issue
        fields = []

    def filter_search(self, queryset, name, value):
        from datetime import datetime

        # Universal search for description and status
        query = Q(description__icontains=value) | Q(status__icontains=value)

        # List of potential date formats to try parsing
        date_formats = [
            '%b %d, %Y',  # Format: 'Nov 10, 2023'
            '%b %d %Y',  # Format: 'Nov 10 2023'
            '%b %d',  # Format: 'Nov 10'
            '%b %Y',  # Format: 'Nov 2023'
            '%d %Y',  # Format: '10 2023'
            '%Y',  # Format: '2023'
            '%b',  # Format: 'Nov'
            '%d',  # Format: '10'
        ]

        for date_format in date_formats:
            try:
                # Attempt to parse the provided value with one of the formats
                parsed_date = datetime.strptime(value, date_format)

                # Apply year, month, and day-based filtering for created_at and resolution_date
                if date_format == '%Y':
                    query |= Q(created_at__year=parsed_date.year) | Q(resolution_date__year=parsed_date.year)
                elif date_format in ['%b %d, %Y', '%b %d %Y']:
                    query |= Q(created_at__date=parsed_date.date()) | Q(resolution_date__date=parsed_date.date())
                elif date_format == '%b %d':
                    query |= Q(created_at__month=parsed_date.month, created_at__day=parsed_date.day) | \
                             Q(resolution_date__month=parsed_date.month, resolution_date__day=parsed_date.day)
                elif date_format == '%b %Y':
                    query |= Q(created_at__month=parsed_date.month, created_at__year=parsed_date.year) | \
                             Q(resolution_date__month=parsed_date.month, resolution_date__year=parsed_date.year)
                elif date_format == '%d %Y':
                    query |= Q(created_at__day=parsed_date.day, created_at__year=parsed_date.year) | \
                             Q(resolution_date__day=parsed_date.day, resolution_date__year=parsed_date.year)
                elif date_format == '%b':
                    query |= Q(created_at__month=parsed_date.month) | Q(resolution_date__month=parsed_date.month)
                elif date_format == '%d':  # Specifically handle day-only queries
                    query |= Q(created_at__day=parsed_date.day) | Q(resolution_date__day=parsed_date.day)
                break  # If parsing succeeds, break out of the loop
            except ValueError:
                # If parsing fails, continue trying other formats
                continue

        return queryset.filter(query)


class StudentFeedbackFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')  # Universal search
    ordering = filters.OrderingFilter(
        fields=(
            ('created_by__name', 'created_by'),
            ('description', 'description'),
            ('created_at', 'created_at'),
            ('student__name', 'student'),  # Sorting by created date
        )
    )

    class Meta:
        model = StudentFeedback
        fields = []

    def filter_search(self, queryset, name, value):
        from datetime import datetime

        # Universal search for created_by, description, and created_at
        query = Q(created_by__name__icontains=value) | Q(description__icontains=value)

        # List of potential date formats to try parsing
        date_formats = [
            '%b %d, %Y',  # Format: 'Nov 10, 2023'
            '%b %d %Y',  # Format: 'Nov 10 2023'
            '%b %d',  # Format: 'Nov 10'
            '%b %Y',  # Format: 'Nov 2023'
            '%d %Y',  # Format: '10 2023'
            '%Y',  # Format: '2023'
            '%b',  # Format: 'Nov'
            '%d',  # Format: '10'
        ]

        for date_format in date_formats:
            try:
                # Attempt to parse the provided value with one of the formats
                parsed_date = datetime.strptime(value, date_format)

                # Apply year, month, and day-based filtering for created_at
                if date_format == '%Y':
                    query |= Q(created_at__year=parsed_date.year)
                elif date_format in ['%b %d, %Y', '%b %d %Y']:
                    query |= Q(created_at__date=parsed_date.date())
                elif date_format == '%b %d':
                    query |= Q(created_at__month=parsed_date.month, created_at__day=parsed_date.day)
                elif date_format == '%b %Y':
                    query |= Q(created_at__month=parsed_date.month, created_at__year=parsed_date.year)
                elif date_format == '%d %Y':
                    query |= Q(created_at__day=parsed_date.day, created_at__year=parsed_date.year)
                elif date_format == '%b':
                    query |= Q(created_at__month=parsed_date.month)
                elif date_format == '%d':  # Specifically handle day-only queries
                    query |= Q(created_at__day=parsed_date.day)
                break  # If parsing succeeds, break out of the loop
            except ValueError:
                # If parsing fails, continue trying other formats
                continue

        return queryset.filter(query)
