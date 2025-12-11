from django.db.models import Q
from django_filters import rest_framework as filters
import django_filters

from .models import Test, TestSubmission, PracticeTest


class TestFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')  # Universal search
    format_type = django_filters.CharFilter(field_name='format_type', lookup_expr='exact')
    test_type = django_filters.CharFilter(field_name='test_type', lookup_expr='exact')
    course = django_filters.NumberFilter(field_name='course_id', lookup_expr='exact')
    created_at = django_filters.DateFromToRangeFilter()  # Allows created_at_after & created_at_before

    ordering = django_filters.OrderingFilter(
        fields=(
            ('name', 'name'),
            ('course__name', 'course'),
            ('created_at', 'created_at'),
            ('testsubmission__assigned_date', 'assigned_date'),
            ('testsubmission__completion_date', 'completion_date'),
        )
    )

    class Meta:
        model = Test
        fields = ['format_type', 'test_type', 'course', 'created_at']

    def filter_search(self, queryset, name, value):
        from datetime import datetime

        try:
            search_date = datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError:
            search_date = None

        if search_date:
            query = (
                Q(testsubmission__assigned_date__date=search_date)
                | Q(testsubmission__completion_date__date=search_date)
            )
        else:
            query = Q(name__icontains=value) | Q(course__name__icontains=value)

        return queryset.filter(query)


class TestSubmissionFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')  # Universal search
    ordering = filters.OrderingFilter(
        fields=(
            ('test__name', 'name'),
            ('test__course__name', 'course_name'),  # Sorting by course name
            ('assigned_date', 'assigned_date'),  # Sorting by assigned date
            ('completion_date', 'completion_date')  # Sorting by completion date
        )
    )

    class Meta:
        model = TestSubmission
        fields = []

    def filter_search(self, queryset, name, value):
        from datetime import datetime

        # Universal search for test name and course name
        query = Q(test__name__icontains=value) | Q(test__course__name__icontains=value)

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

                # Apply year, month, and day-based filtering
                if date_format == '%Y':
                    query |= Q(assigned_date__year=parsed_date.year) | Q(completion_date__year=parsed_date.year)
                elif date_format in ['%b %d, %Y', '%b %d %Y']:
                    query |= Q(assigned_date__date=parsed_date.date()) | Q(completion_date__date=parsed_date.date())
                elif date_format == '%b %d':
                    query |= Q(assigned_date__month=parsed_date.month, assigned_date__day=parsed_date.day) | \
                             Q(completion_date__month=parsed_date.month, completion_date__day=parsed_date.day)
                elif date_format == '%b %Y':
                    query |= Q(assigned_date__month=parsed_date.month, assigned_date__year=parsed_date.year) | \
                             Q(completion_date__month=parsed_date.month, completion_date__year=parsed_date.year)
                elif date_format == '%d %Y':
                    query |= Q(assigned_date__day=parsed_date.day, assigned_date__year=parsed_date.year) | \
                             Q(completion_date__day=parsed_date.day, completion_date__year=parsed_date.year)
                elif date_format == '%b':
                    query |= Q(assigned_date__month=parsed_date.month) | Q(completion_date__month=parsed_date.month)
                elif date_format == '%d':  # Specifically handle day-only queries
                    query |= Q(assigned_date__day=parsed_date.day) | Q(completion_date__day=parsed_date.day)
                break  # If parsing succeeds, break out of the loop
            except ValueError:
                # If parsing fails, continue trying other formats
                continue

        # Apply the filtered query to the queryset
        return queryset.filter(query)


class PracticeTestFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')  # Universal search
    ordering = filters.OrderingFilter(
        fields=(
            ('student__name', 'student'),
            ('course_subject__course__name', 'course'),  # Sorting by course name
            ('course_subject__subject__name', 'subject'),  # Sorting by subject name
            ('created_at', 'created_at'),  # Sorting by creation date
            ('result__correct_answer_count', 'correct_count'),  # Sorting by correct answers
            ('result__incorrect_answer_count', 'incorrect_count'),  # Sorting by incorrect answers
            ('result__time_taken', 'time_taken'),  # Sorting by time taken
        )
    )

    class Meta:
        model = PracticeTest
        fields = []

    def filter_search(self, queryset, name, value):
        from datetime import datetime

        # Check if the value can be an integer (for correct_count, incorrect_count, or time_taken)
        # try:
        #     value_as_int = int(value)
        # except ValueError:
        #     value_as_int = None

        # Universal search for student name, course name, subject name, correct/incorrect counts, and time taken
        query = Q(student__name__icontains=value) | \
                Q(course_subject__course__name__icontains=value) | \
                Q(course_subject__subject__name__icontains=value)

        # if value_as_int is not None:
        #     # If the value is a number, search in correct_count, incorrect_count, and time_taken
        #     query |= Q(result__correct_answer_count=value_as_int) | \
        #              Q(result__incorrect_answer_count=value_as_int)

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

                # Apply year, month, and day-based filtering
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
