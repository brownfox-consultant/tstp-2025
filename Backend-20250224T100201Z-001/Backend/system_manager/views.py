import logging
from datetime import datetime

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from course_manager.models import Question
from notification_manager.models import NotificationTemplate, Notification
from notification_manager.utils import send_notification, mark_notification_as_read
from sTest.permissions import IsStudent,IsFaculty, IsAdminOrFaculty, IsAdminOrMentor, \
    IsAdminOrMentorOrFacultyOrStudentOrParent, IsAdmin, IsParent, IsAdminOrParent, \
    IsAdminOrContentDeveloperOrFaculty, IsAdminOrMentorOrStudentOrParent, IsAdminOrMentorOrFaculty
from sTest.utils import get_error_response_for_serializer, get_error_response, CustomPageNumberPagination
from system_manager.models import Doubt, Issue, Concern, Meeting, Suggestion, StudentFeedback
from user_manager.models import StudentMetadata
from .filters import DoubtFilter, IssueFilter, StudentFeedbackFilter
from .serializers import RaiseDoubtSerializer, AssignFacultySerializer, ResolveDoubtSerializer, IssueSerializer, \
    IssueResolveSerializer, ConcernSerializer, ConcernResolveSerializer, MeetingSerializer, \
    RaiseIssueSerializer, DoubtListSerializer, CreateSuggestionSerializer, SuggestionListSerializer, \
    RaiseConcernSerializer, ScheduleMeetingSerializer, CreateStudentFeedbackSerializer, StudentFeedbackSerializer, \
    ApproveMeetingSerializer
from .filters import ConcernFilter
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from system_manager.models import Meeting
from system_manager.serializers import MeetingSerializer
from .filters import MeetingFilter
import django_filters as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from system_manager.models import Doubt, Suggestion, StudentFeedback
from user_manager.models import StudentMetadata
from .serializers import (
    CreateStudentFeedbackSerializer, StudentFeedbackSerializer

)
from system_manager.models import Issue
from user_manager.models import User 
from .filters import StudentFeedbackFilter
from sTest.permissions import (
    IsAdmin, IsAdminOrMentorOrFaculty, IsAdminOrMentorOrFacultyOrStudentOrParent,
    IsAdminOrMentorOrStudentOrParent
)

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters as drf_filters
from system_manager.filters import SuggestionFilter
from django.db.models.functions import Lower
from rest_framework.decorators import api_view, permission_classes
from test_manager.models import TestFeedback




class DoubtViewSet(viewsets.ModelViewSet):
    queryset = Doubt.objects.all()
    serializer_class = DoubtListSerializer
    logger = logging.getLogger('Doubts')


    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='developer_unread_summary')
    def get_developer_unread_summary(self, request):
        user = request.user

        # ✅ Allow only content developers or admins
        if not hasattr(user, 'role') or user.role.name.lower() not in ['content_developer', 'admin']:
            return Response({"detail": "You do not have permission to perform this action."}, status=403)

        summary = {
            "Suggestions": Suggestion.objects.filter(status=Suggestion.IN_REVIEW).count(),
            "TotalQuestions": Question.objects.count(),
            "Questions_Not_Active_total": Question.objects.filter(is_active=False).count()  # or use .exclude(status='ACTIVE')
        }

        return Response(summary)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='students-by-mentor')
    def get_students_by_mentor(self, request):
        mentor_id = request.query_params.get('mentor_id')

        if not mentor_id:
            return Response({"error": "mentor_id is required."}, status=400)

        try:
            mentor = User.objects.get(id=mentor_id)
        except User.DoesNotExist:
            return Response({"error": "Mentor not found."}, status=404)

        student_ids = StudentMetadata.objects.filter(mentor=mentor).values_list('student_id', flat=True)
        return Response({"student_ids": list(student_ids)}, status=200)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='students-by-faculty')
    def get_students_by_faculty(self, request):
        faculty_id = request.query_params.get('faculty_id')

        if not faculty_id:
            return Response({"error": "faculty_id is required."}, status=400)

        try:
            faculty = User.objects.get(id=faculty_id)
        except User.DoesNotExist:
            return Response({"error": "Faculty not found."}, status=404)

        student_ids = StudentMetadata.objects.filter(faculties=faculty).values_list('student_id', flat=True)
        return Response({"student_ids": list(student_ids)}, status=200)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='mentor_unread_summary')
    def get_mentor_unread_summary(self, request):
        user = request.user
    # ✅ Only allow mentors
        if not hasattr(user, 'role') or user.role.name.lower() != 'mentor':
            return Response({"detail": "You do not have permission to perform this action."}, status=403)

        summary = {
            "Feedbacks": 0,
            "Doubt": 0,
            "Issues": 0,
        }

    # 👨‍🏫 Get student IDs under this mentor
        student_ids = StudentMetadata.objects.filter(mentor=user).values_list('student_id', flat=True)

    # 📊 Count Feedbacks
        summary["Feedbacks"] = StudentFeedback.objects.filter(student_id__in=student_ids).count()

    # 📊 Count Doubts (only unresolved)
        summary["Doubt"] = Doubt.objects.filter(student_id__in=student_ids).exclude(status=Doubt.RESOLVED).count()

    # 📊 Count Suggestions (not approved or rejected)
        summary["Issues"] = Issue.objects.filter(student_id__in=student_ids).exclude(status=Issue.RESOLVED).count()

        return Response(summary)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='faculty_unread_summary')
    def get_faculty_unread_summary(self, request):
        user = request.user
        # ✅ Only allow faculty by checking role
        if not hasattr(user, 'role') or user.role.name.lower() != 'faculty':
            return Response({"detail": "You do not have permission to perform this action."}, status=403)

        summary = {
            "Feedbacks": 0,
            "Doubt": 0,
            "Suggestion": 0,
        }

        student_ids = StudentMetadata.objects.filter(faculties=user).values_list('student', flat=True)
        summary["Feedbacks"] = StudentFeedback.objects.filter(student_id__in=student_ids).count()
        summary["Doubt"] = Doubt.objects.filter(faculty=user).exclude(status=Doubt.RESOLVED).count()
        summary["Suggestion"] = Suggestion.objects.filter(
         ~Q(status__in=[Suggestion.APPROVED, Suggestion.REJECTED])
        ).count()
        

        return Response(summary)

    @permission_classes([IsStudent])
    def create(self, request):
        data = request.data
        data['student'] = request.user.id
        data['status'] = Doubt.RAISED
        serializer = RaiseDoubtSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            doubt = serializer.save()

            notification_params = {NotificationTemplate.USER_NAME: request.user.name,
                                   NotificationTemplate.REFERENCE_ID: doubt.id}
            send_notification.delay(notification_name=Notification.DOUBT_RAISED_NOTIFICATION,
                                    params=notification_params,
                                    user_id=request.user.id)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @action(detail=True, methods=['PATCH'], permission_classes=[IsAdminOrMentor],
            serializer_class=AssignFacultySerializer)
    def assign_faculty(self, request, pk=None):
        doubt = Doubt.get_doubt_by_id(pk)
        serializer = self.get_serializer(doubt, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save(status=Doubt.ASSIGNED_TO_FACULTY, faculty_assigned_date=timezone.now())

            notification_params = {NotificationTemplate.USER_NAME: doubt.student.name,
                                   NotificationTemplate.REFERENCE_ID: doubt.id}
            send_notification.delay(notification_name=Notification.DOUBT_RAISED_NOTIFICATION,
                                    params=notification_params,
                                    user_id=doubt.faculty.id)

            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @action(detail=True, methods=['PATCH'], permission_classes=[IsAdminOrFaculty],
        serializer_class=ResolveDoubtSerializer)
    def resolve_doubt(self, request, pk=None):
        doubt = Doubt.get_doubt_by_id(pk)
        serializer = self.get_serializer(doubt, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save(
                status=Doubt.RESOLVED,
                resolution_date=timezone.now(),
                resolved_by=request.user   # ✅ save who resolved
            )

            mark_notification_as_read.delay(
                user_id=doubt.student.id,
                category=Notification.DOUBT,
                reference_id=doubt.id
            )

            if doubt.faculty is not None:
                mark_notification_as_read.delay(
                    user_id=doubt.faculty.id,
                    category=Notification.DOUBT,
                    reference_id=doubt.id
                )

            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return get_error_response_for_serializer(
                logger=self.logger,
                serializer=serializer,
                data=request.data
            )


    @permission_classes([IsAdminOrMentorOrFacultyOrStudentOrParent])
    def list(self, request):
        user = request.user

        if user.role.name == 'admin':
            qs = self.queryset.all()
        elif user.role.name == 'student':
            qs = self.queryset.filter(student=user)
        elif user.role.name == 'faculty':
            qs = self.queryset.filter(faculty=user)
        elif user.role.name == 'mentor':
            sm = StudentMetadata.objects.filter(mentor=user)
            qs = self.queryset.filter(student__in=sm.values_list('student', flat=True))
        elif user.role.name == 'parent':
            sm = StudentMetadata.objects.filter(Q(father=user) | Q(mother=user))
            qs = self.queryset.filter(student__in=sm.values_list('student', flat=True))
        else:
            qs = self.queryset.none()

        # Apply filtering and sorting using DoubtFilter
        filterset = DoubtFilter(request.GET, queryset=qs)
        if not filterset.is_valid():
            return get_error_response('Invalid filter parameters')

        filtered_doubts = filterset.qs

        # Apply pagination
        paginator = CustomPageNumberPagination()
        paginated_doubts = paginator.paginate_queryset(filtered_doubts, request)

        serializer = DoubtListSerializer(paginated_doubts, many=True)

        # Return the paginated response
        return paginator.get_paginated_response(serializer.data)


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    logger = logging.getLogger('Issues')

    @permission_classes([IsStudent])
    def create(self, request):
        data = request.data
        data['student'] = request.user.id
        data['status'] = Issue.RAISED
        serializer = RaiseIssueSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            issue = serializer.save()

            notification_params = {NotificationTemplate.USER_NAME: request.user.name,
                                   NotificationTemplate.REFERENCE_ID: issue.id}
            send_notification.delay(notification_name=Notification.ISSUE_RAISED_NOTIFICATION,
                                    params=notification_params,
                                    user_id=None)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @permission_classes([IsAdminOrMentorOrStudentOrParent])
    def list(self, request):
        user = request.user

        if user.role.name == 'admin':
            issues = self.queryset.all()
        elif user.role.name == 'mentor':
            sm = StudentMetadata.objects.filter(mentor=user)
            issues = self.queryset.filter(student__in=sm.values_list('student', flat=True))
        elif user.role.name == 'student':
            issues = self.queryset.filter(student=user)
        elif user.role.name == 'parent':
            sm = StudentMetadata.objects.filter(Q(father=user) | Q(mother=user))
            issues = self.queryset.filter(student__in=sm.values_list('student', flat=True))
        else:
            return Response({"detail": "Access Denied"}, status=status.HTTP_403_FORBIDDEN)

        # ✅ Apply filters FIRST
        filterset = IssueFilter(request.GET, queryset=issues)
        if not filterset.is_valid():
            return Response({"detail": "Invalid filter parameters"}, status=status.HTTP_400_BAD_REQUEST)

        filtered_issues = filterset.qs

        # ✅ THEN apply case-insensitive ordering
        ordering = request.GET.get("ordering", "description")
        if ordering in ("description", "-description"):
            direction = "-" if ordering.startswith("-") else ""
            filtered_issues = filtered_issues.annotate(lower_description=Lower("description")).order_by(f"{direction}lower_description")
        else:
            filtered_issues = filtered_issues.order_by(ordering)

        # ✅ Paginate and serialize
        paginator = CustomPageNumberPagination()
        paginated_issues = paginator.paginate_queryset(filtered_issues, request)
        serializer = IssueSerializer(paginated_issues, many=True)

        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=['PATCH'], permission_classes=[IsAdmin], url_path='resolve')
    def resolve_issue(self, request, pk=None):
        issue = self.get_object()
        serializer = IssueResolveSerializer(data=request.data, instance=issue)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save(
                status=Issue.RESOLVED,
                resolution_date=timezone.now(),
                resolved_by=request.user   # ✅ store admin
            )

            mark_notification_as_read.delay(
                user_id=None,
                category=Notification.ISSUE,
                reference_id=issue.id
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return get_error_response_for_serializer(
                logger=self.logger,
                serializer=serializer,
                data=request.data
            )


class ConcernViewSet(viewsets.ModelViewSet):
    queryset = Concern.objects.all()
    serializer_class = ConcernSerializer
    logger = logging.getLogger('Concerns')

    @permission_classes([IsParent])
    def create(self, request):
        data = request.data
        data['parent'] = request.user.id
        data['status'] = Concern.RAISED
        serializer = RaiseConcernSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            concern = serializer.save()

            notification_params = {NotificationTemplate.USER_NAME: request.user.name,
                                   NotificationTemplate.REFERENCE_ID: concern.id}
            send_notification.delay(notification_name=Notification.CONCERN_RAISED_NOTIFICATION,
                                    params=notification_params,
                                    user_id=None)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @permission_classes([IsAdminOrParent])
    def list(self, request):
        user = request.user
        if user.role.name == 'admin':
            concerns = self.queryset.all()
        elif user.role.name == 'parent':
            concerns = self.queryset.filter(parent=user)
        else:
            return Response({"detail": "Access Denied"}, status=status.HTTP_403_FORBIDDEN)

    # 🔥 Apply filtering and sorting
        filterset = ConcernFilter(request.GET, queryset=concerns)
        if not filterset.is_valid():
            return Response({"detail": "Invalid filter parameters"}, status=status.HTTP_400_BAD_REQUEST)

        filtered_concerns = filterset.qs

    # Apply pagination
        paginator = CustomPageNumberPagination()
        paginator.page_size = 15
        paginated_concerns = paginator.paginate_queryset(filtered_concerns, request)

        serializer = ConcernSerializer(paginated_concerns, many=True)

        return paginator.get_paginated_response(serializer.data)


    @action(detail=True, methods=['PATCH'], permission_classes=[IsAdmin], url_path='resolve')
    def resolve_concern(self, request, pk=None):
        concern = self.get_object()
        serializer = ConcernResolveSerializer(data=request.data, instance=concern)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save(status=Concern.RESOLVED, resolution_date=timezone.now())

            mark_notification_as_read.delay(user_id=None, category=Notification.CONCERN, reference_id=concern.id)

            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)


class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = MeetingFilter
    ordering_fields = [
    'description',
    'requested_by__email',
    'requested_by__phone_number',
    'requested_by__name',
    'approved_time',  # ✅ this is fine
    'status',
    'created_at',
]
    ordering = ['-created_at']
    logger = logging.getLogger('Meetings')

    @action(detail=False, methods=['POST'], permission_classes=[IsParent], url_path='schedule')
    def schedule_meeting(self, request):
        data = request.data
        data['requested_by'] = request.user.id
        data['status'] = Meeting.SCHEDULED

        serializer = ScheduleMeetingSerializer(data=data)

        try:
            serializer.is_valid(raise_exception=True)
            meeting = serializer.save()

            # You can notify about the first proposed time or summarize all
            notification_params = {
                NotificationTemplate.USER_NAME: request.user.name,
                NotificationTemplate.SCHEDULED_MEETING_TIME: ", ".join(
                    [dt.strftime("%Y-%m-%d %H:%M") for dt in meeting.requested_times]
                ),
                NotificationTemplate.REFERENCE_ID: meeting.id,
            }

            send_notification.delay(
                notification_name=Notification.MEETING_SCHEDULED_NOTIFICATION,
                params=notification_params,
                user_id=None
            )

            return Response(MeetingSerializer(meeting).data, status=status.HTTP_201_CREATED)

        except Exception:
            return get_error_response_for_serializer(
                logger=self.logger,
                serializer=serializer,
                data=request.data
            )

    @action(detail=True, methods=['POST'], permission_classes=[IsAdmin], url_path='approve')
    def approve_meeting(self, request, pk=None):
        meeting = self.get_object()
        data = request.data
        data['status'] = Meeting.APPROVED
        serializer = ApproveMeetingSerializer(data=data, instance=meeting)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @permission_classes([IsAdminOrParent])
    def list(self, request):
        user = request.user

        if user.role.name == 'admin':
            meetings = self.queryset.all()
        elif user.role.name == 'parent':
            meetings = self.queryset.filter(requested_by=user)
        else:
            meetings = self.queryset.none()

    # Apply filtering and sorting
        filtered_queryset = self.filter_queryset(meetings)

    # Apply pagination
        paginator = CustomPageNumberPagination()
        paginated_meetings = paginator.paginate_queryset(filtered_queryset, request)

        serializer = self.get_serializer(paginated_meetings, many=True)
        return paginator.get_paginated_response(serializer.data)


    @action(detail=True, methods=['POST'], permission_classes=[IsAdmin], url_path='mark-complete')
    def mark_meeting_as_complete(self, request, pk=None):
        meeting = self.get_object()
        meeting.status = Meeting.COMPLETED
        meeting.save()

        mark_notification_as_read.delay(user_id=None, category=Notification.MEETING, reference_id=meeting.id)

        return Response(data={"detail": "Meeting marked as completed successfully."}, status=status.HTTP_200_OK)


class SuggestionViewSet(viewsets.ModelViewSet):
    queryset = Suggestion.get_all()
    serializer_class = CreateSuggestionSerializer
    logger = logging.getLogger('Suggestion')

    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter, drf_filters.SearchFilter]
    filterset_class = SuggestionFilter
    search_fields = [
        'question__description',
        'status',
        'created_by__name',
        'question__course__name',
    ]
    ordering_fields = [
        'created_at',
        'status',
        'created_by__name',
        'question__course__name',
        'question__difficulty',
        'question__srno',
    ]
    ordering = ['-created_at']

    @permission_classes([IsAdminOrContentDeveloperOrFaculty])
    def create(self, request, *args, **kwargs):
        data = request.data

        question = Question.get_question_by_id(data.get('question'))
        if question.has_suggestion:
            return get_error_response(
                'A suggestion has already been raised for this question. On Approval/Rejection of the existing '
                'suggestion you will be able to raise another suggestion.')

        data['status'] = Suggestion.IN_REVIEW
        data['created_by'] = request.user.id

        question_type = data.get('question_type')
        # Pass question_type in the context
        context = {'request': request, 'question_type': question_type}

        serializer = self.get_serializer(data=data, context=context)
        try:
            serializer.is_valid(raise_exception=True)
            suggestion = serializer.save()

            question = Question.get_question_by_id(data.get('question'))
            question.has_suggestion = True
            question.save()

            headers = self.get_success_headers(serializer.data)

            notification_params = {NotificationTemplate.USER_NAME: request.user.name,
                                   NotificationTemplate.REFERENCE_ID: suggestion.id}
            send_notification.delay(notification_name=Notification.SUGGESTION_RAISED_NOTIFICATION,
                                    params=notification_params,
                                    user_id=None)

            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrContentDeveloperOrFaculty],
            url_path='suggestion-for-question')
    def get_suggestion_for_question(self, request, pk=None):
        question_id = self.request.query_params.get('question_id', None)
        suggestion = Suggestion.get_suggestion_for_question(question_id=question_id)
        serializer = SuggestionListSerializer(suggestion)
        return Response(data=serializer.data, status=status.HTTP_200_OK)

    @permission_classes([IsAdminOrContentDeveloperOrFaculty])
    def list(self, request):
        

        # Apply pagination
        queryset = self.filter_queryset(self.get_queryset())

        paginator = CustomPageNumberPagination()
        paginated_qs = paginator.paginate_queryset(queryset, request)

        serializer = SuggestionListSerializer(paginated_qs, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    
    @action(
    detail=False,
    methods=['get'],
    permission_classes=[IsAdminOrContentDeveloperOrFaculty],
    url_path='suggestion-creators'
)
    def suggestion_creators(self, request):
        # Get all users who have created suggestions
        creators = User.objects.filter(suggestion__isnull=False).distinct()
        data = [
            {"id": u.id, "name": u.name}  # Use 'name' instead of 'username'/'first_name'
            for u in creators
        ]
        return Response(data)


    @action(detail=True, methods=['post'], permission_classes=[IsAdmin], url_path='approve')
    def approve_suggestion(self, request, pk=None):
        suggestion = Suggestion.get_suggestion_by_id(suggestion_id=pk)

        if suggestion.status != Suggestion.IN_REVIEW:
            return get_error_response('Suggestion can only be approved if it is in \'In Review\' state.')

        question = suggestion.question
        question.description = suggestion.description
        question.reading_comprehension_passage = suggestion.reading_comprehension_passage
        question.options = suggestion.options
        question.question_type = suggestion.question_type
        question.question_subtype = suggestion.question_subtype
        question.topic = suggestion.topic
        question.sub_topic = suggestion.sub_topic
        question.difficulty = suggestion.difficulty
        question.test_type = suggestion.test_type
        question.updated_at = timezone.now()
        question.show_calculator = suggestion.show_calculator
        question.has_suggestion = False
        question.directions = suggestion.directions
        question.explanation = suggestion.explanation
        question.save()

        suggestion.status = Suggestion.APPROVED
        suggestion.save()

        mark_notification_as_read.delay(user_id=None, category=Notification.SUGGESTION, reference_id=suggestion.id)

        return Response({"detail": "Suggestion approved successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin], url_path='reject')
    def reject_suggestion(self, request, pk=None):
        suggestion = Suggestion.get_suggestion_by_id(suggestion_id=pk)

        if suggestion.status != Suggestion.IN_REVIEW:
            return get_error_response('Suggestion can only be approved if it is in \'In Review\' state.')

        question = suggestion.question
        question.has_suggestion = False
        question.save()

        suggestion.status = Suggestion.REJECTED
        suggestion.save()

        mark_notification_as_read.delay(user_id=None, category=Notification.SUGGESTION, reference_id=suggestion.id)

        return Response({"detail": "Suggestion rejected successfully"}, status=status.HTTP_200_OK)


class StudentFeedbackViewSet(viewsets.ModelViewSet):
    queryset = StudentFeedback.objects.all()
    logger = logging.getLogger('StudentFeedback')
    
    # Define a custom method to dynamically select permission classes
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [IsAdminOrMentorOrFaculty]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAdminOrMentorOrFacultyOrStudentOrParent]
        else:
            permission_classes = [IsAdmin]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        data = request.data
        data['created_by'] = request.user.id
        serializer = CreateStudentFeedbackSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            feedback = serializer.save()

            notification_params = {
                NotificationTemplate.USER_NAME: request.user.name,
                NotificationTemplate.REFERENCE_ID: feedback.id
            }
            send_notification.delay(
                notification_name=Notification.FEEDBACK_PROVIDED_NOTIFICATION,
                params=notification_params,
                user_id=feedback.student.id
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return get_error_response_for_serializer(
                logger=self.logger,
                serializer=serializer,
                data=request.data
            )

   

    def list(self, request, *args, **kwargs):
        user = request.user
        print("Role:", user.role.name)
       

        if user.role.name == 'admin':
            feedbacks = self.queryset.all()
            print("Feedback count before filter:", feedbacks.count())
        elif user.role.name == 'mentor':
            feedbacks = self.queryset.filter(created_by=user)
            print("Feedback count before filter:", feedbacks.count())
        elif user.role.name == 'student':
            feedbacks = self.queryset.filter(student=user)
            print("Feedback count before filter:", feedbacks.count())
        elif user.role.name == 'parent':
            sm = StudentMetadata.objects.filter(Q(father=user) | Q(mother=user))
            feedbacks = self.queryset.filter(student__in=sm.values_list('student', flat=True))
            print("Feedback count before filter:", feedbacks.count())
        elif user.role.name == 'faculty':
            sm = StudentMetadata.objects.filter(faculties=user)
            feedbacks = self.queryset.filter(student__in=sm.values_list('student', flat=True))
            print("Feedback count before filter:", feedbacks.count())
        else:
            return Response({"detail": "Access Denied"}, status=status.HTTP_403_FORBIDDEN)

        filterset = StudentFeedbackFilter(request.GET, queryset=feedbacks)
        if not filterset.is_valid():
            return Response({"detail": "Invalid filter parameters"}, status=status.HTTP_400_BAD_REQUEST)

        filtered_feedbacks = filterset.qs
        paginator = CustomPageNumberPagination()
        paginated_feedbacks = paginator.paginate_queryset(filtered_feedbacks, request)
        serializer = StudentFeedbackSerializer(paginated_feedbacks, many=True)

        return paginator.get_paginated_response(serializer.data)
