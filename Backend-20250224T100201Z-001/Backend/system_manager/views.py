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
    RaiseIssueSerializer, DoubtListSerializer, CreateSuggestionSerializer, SetTimeSlotSerializer, SuggestionListSerializer, \
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
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from django.db.models.functions import TruncMonth
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from system_manager.models import Doubt
from course_manager.models import Course
from user_manager.models import User
from django.db.models import Count, Avg, F, Q, ExpressionWrapper, DurationField
from django.db.models.functions import TruncMonth
from system_manager.models import FacultyTimeSlot
from .serializers import FacultyTimeSlotSerializer, CreateFacultyTimeSlotSerializer
from .filters import FacultyTimeSlotFilter
from datetime import timedelta
from django.utils import timezone

from test_manager.models import TestSubmission, PracticeTestResult
from system_manager.models import (
    Doubt,
    Issue,
    Concern,
    Meeting,
    Suggestion
)
from test_manager.models import (
    Section,
    QuestionAnswer,
    
)
from course_manager.models import (
    Course,
    Subject,
    CourseSubjects,
    Topic,
    SubTopic,
    CombinedScore
)



class DoubtViewSet(viewsets.ModelViewSet):
    queryset = Doubt.objects.all()
    serializer_class = DoubtListSerializer
    logger = logging.getLogger('Doubts')


    def calculate_flt_score(self, test_submission):
        """
        Calculate Full Length Test total score using the same
        CombinedScore logic as ResultViewSet.get_details().
        """

        if not hasattr(test_submission, "result"):
            return 0

        result = test_submission.result
        test = test_submission.test

        total_score = 0

        sections = (
            Section.objects
            .filter(test=test)
            .select_related(
                "course_subject",
                "course_subject__subject",
            )
            .order_by("order")
        )

        # Group sections by subject
        subjects_map = {}

        for section in sections:
            subject_id = section.course_subject.id

            if subject_id not in subjects_map:
                subjects_map[subject_id] = {
                    "course_subject": section.course_subject,
                    "sections": []
                }

            subjects_map[subject_id]["sections"].append(section)

        # Calculate subject scores
        for _, subject_info in subjects_map.items():

            course_subject = subject_info["course_subject"]

            section_1_correct = 0
            section_2_correct = 0

            for section in subject_info["sections"]:

                for sub_section in section.sub_sections:

                    correct_count = QuestionAnswer.objects.filter(
                        result=result,
                        course_subject=course_subject,
                        section_id=sub_section["id"],
                        is_correct=True,
                    ).count()

                    if sub_section["id"] == 1:
                        section_1_correct = correct_count
                    else:
                        section_2_correct = correct_count

            score_record = CombinedScore.objects.filter(
                subject_name=course_subject.subject.name,
                section1_correct=section_1_correct,
                section2_correct=section_2_correct,
            ).first()

            if score_record:
                total_score += score_record.total_score

        return total_score

    @action(
    detail=False,
    methods=["GET"],
    permission_classes=[IsAuthenticated],
    url_path="activity-feed"
)
    def activity_feed(self, request):

        today = timezone.localdate()
        previous_day = today - timedelta(days=1)

        today_start = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.min.time())
        )

        previous_start = timezone.make_aware(
            timezone.datetime.combine(previous_day, timezone.datetime.min.time())
        )

        previous_end = today_start

        def build_activity(day_start, day_end=None):

            activities = []

            # --------------------------
            # Pending Doubts
            # --------------------------
            pending_queryset = Doubt.objects.filter(
                status=Doubt.RAISED,
                created_at__gte=day_start,
            )

            if day_end:
                pending_queryset = pending_queryset.filter(
                    created_at__lt=day_end
                )

            pending_doubts = pending_queryset.count()
            latest_pending_doubt = pending_queryset.order_by("-created_at").first()

            if pending_doubts:
                activities.append({
                    "id": "pending-doubts",
                    "type": "doubt",
                    "title": "Pending Doubts",
                    "description": f"{pending_doubts} doubts are waiting for faculty response.",
                    "meta": f"{pending_doubts} Pending",
                    "status": "warning",
                    "icon": "question-circle",
                    "color": "#faad14",
                    "time": latest_pending_doubt.created_at,
                })

            # --------------------------
            # Full Length Tests
            # --------------------------

            fl_queryset = TestSubmission.objects.filter(
                status=TestSubmission.COMPLETED,
                completion_date__gte=day_start
            )

            if day_end:
                fl_queryset = fl_queryset.filter(
                    completion_date__lt=day_end
                )

            for obj in fl_queryset.select_related("student", "test"):
                score = self.calculate_flt_score(obj)

                activities.append({
                    "id": obj.id,
                    "type": "fl-test",
                    "title": "Full Length Test Completed",
                    "description": f"{obj.student.name} completed '{obj.test.name}'.",
                    "meta": f"Score: {score}",
                    "status": "success",
                    "icon": "file-done",
                    "color": "#52c41a",
                    "time": obj.completion_date,
                })

            # --------------------------
            # Practice Tests
            # --------------------------

            

            practice_queryset = PracticeTestResult.objects.filter(
                created_at__gte=day_start
            )

            if day_end:
                practice_queryset = practice_queryset.filter(
                    created_at__lt=day_end
                )

            practice_queryset = practice_queryset.select_related(
                "practice_test",
                "practice_test__student",
                "practice_test__course_subject",
                "practice_test__course_subject__subject",
            )

            for obj in practice_queryset:

                student_name = obj.practice_test.student.name
                subject_name = obj.practice_test.course_subject.subject.name

                activities.append({
                    "id": f"practice-{obj.id}",
                    "type": "pr-test",
                    "title": "Practice Test Completed",
                    "description": (
                        f"{student_name} completed {subject_name} Practice Test."
                    ),
                    "meta": f"Correct Answers: {obj.correct_answer_count}",
                    "status": "success",
                    "icon": "read",
                    "color": "#1890ff",
                    "time": obj.created_at,
                })

                

            # --------------------------
            # Issues
            # --------------------------

            issue_queryset = Issue.objects.filter(
                created_at__gte=day_start
            )

            if day_end:
                issue_queryset = issue_queryset.filter(
                    created_at__lt=day_end
                )

            for obj in issue_queryset.select_related("student"):

                activities.append({
                    "id": f"issue-{obj.id}",
                    "type": "issue",
                    "title": "Issue Raised",
                    "description": f"{obj.student.name} submitted a support issue.",
                    "meta": obj.status.replace("_", " ").title(),
                    "status": "error",
                    "icon": "warning",
                    "color": "#ff4d4f",
                    "time": obj.created_at,
                })

            # --------------------------
            # Concerns
            # --------------------------

            concern_queryset = Concern.objects.filter(
                created_at__gte=day_start
            )

            if day_end:
                concern_queryset = concern_queryset.filter(
                    created_at__lt=day_end
                )

            for obj in concern_queryset.select_related("parent"):

                activities.append({
                    "id": f"concern-{obj.id}",
                    "type": "concern",
                    "title": "Concern Submitted",
                    "description": f"{obj.parent.name} submitted a concern.",
                    "meta": obj.status.replace("_", " ").title(),
                    "status": "warning",
                    "icon": "exclamation-circle",
                    "color": "#faad14",
                    "time": obj.created_at,
                })

            # --------------------------
            # Suggestions
            # --------------------------

            suggestion_queryset = Suggestion.objects.filter(
                created_at__gte=day_start
            )

            if day_end:
                suggestion_queryset = suggestion_queryset.filter(
                    created_at__lt=day_end
                )

            for obj in suggestion_queryset.select_related("created_by"):

                activities.append({
                    "id": f"suggestion-{obj.id}",
                    "type": "suggestion",
                    "title": "Suggestion Submitted",
                    "description": f"{obj.created_by.name} submitted a suggestion.",
                    "meta": obj.status.replace("_", " ").title(),
                    "status": "info",
                    "icon": "bulb",
                    "color": "#722ed1",
                    "time": obj.created_at,
                })

            # --------------------------
            # Meetings
            # --------------------------

            meeting_queryset = Meeting.objects.filter(
                created_at__gte=day_start
            )

            if day_end:
                meeting_queryset = meeting_queryset.filter(
                    created_at__lt=day_end
                )

            for obj in meeting_queryset.select_related("requested_by"):

                activities.append({
                    "id": f"meeting-{obj.id}",
                    "type": "meeting",
                    "title": "Meeting Requested",
                    "description": f"{obj.requested_by.name} requested a meeting.",
                    "meta": obj.status.replace("_", " ").title(),
                    "status": "info",
                    "icon": "calendar",
                    "color": "#13c2c2",
                    "time": obj.created_at,
                })

            activities.sort(
                key=lambda x: x["time"],
                reverse=True
            )

            return activities

        return Response({
            "today": build_activity(today_start),
            "previous_day": build_activity(previous_start, previous_end)
        })

    @action(
        detail=False,
        methods=["GET"],
        permission_classes=[IsAuthenticated],
        url_path="status-of-doubts"
    )
    def status_of_doubts(self, request):
        student_id = request.GET.get("student_id")
        course_id = request.GET.get("course_id")
        test_type = request.GET.get("test_type")  # EXAM | PRACTICE

        if not student_id or not course_id:
            return Response(
                {"error": "student_id and course_id are required"},
                status=400
            )

        student = get_object_or_404(User, id=student_id)
        course = get_object_or_404(Course, id=course_id)

        # ==================================================
        # ✅ BASE QUERY (WORKS FOR EXAM + PRACTICE)
        # ==================================================
        doubts_qs = Doubt.objects.filter(
            student=student
        ).filter(
            Q(course_subject__course=course) |
            Q(question__course_subject__course=course)
        )

        # ==================================================
        # ✅ TEST TYPE FILTER
        # ==================================================
        if test_type:
            if test_type == "PRACTICE":
                doubts_qs = doubts_qs.filter(
                    Q(test__test_type="PRACTICE") |
                    Q(question__test_type="SELF_PRACTICE_TEST")
                )
            else:
                doubts_qs = doubts_qs.filter(
                    test__test_type=test_type
                )

        # ==================================================
        # 1️⃣ MONTH-WISE RAISED vs SOLVED
        # ==================================================
        monthly = (
            doubts_qs
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                raised=Count("id"),
                solved=Count("id", filter=Q(status=Doubt.RESOLVED))
            )
            .order_by("month")
        )

        chart_data = [
            {
                "month": row["month"].strftime("%b-%y"),
                "raised": row["raised"],
                "solved": row["solved"]
            }
            for row in monthly
        ]

        # ==================================================
        # 2️⃣ SUMMARY
        # ==================================================
        total_raised = doubts_qs.count()
        total_solved = doubts_qs.filter(status=Doubt.RESOLVED).count()

        resolution_rate = round(
            (total_solved / total_raised) * 100, 2
        ) if total_raised else 0

        # ==================================================
        # 3️⃣ AVERAGE RESOLUTION TIME (HOURS)
        # ==================================================
        resolved_doubts = doubts_qs.filter(
            status=Doubt.RESOLVED,
            resolution_date__isnull=False
        ).annotate(
            resolution_time=ExpressionWrapper(
                F("resolution_date") - F("created_at"),
                output_field=DurationField()
            )
        )

        avg_resolution = resolved_doubts.aggregate(
            avg_time=Avg("resolution_time")
        )["avg_time"]

        avg_hours = round(
            avg_resolution.total_seconds() / 3600, 1
        ) if avg_resolution else 0

        # ==================================================
        # ✅ FINAL RESPONSE
        # ==================================================
        return Response({
            "filters": {
                "student_id": student_id,
                "course_id": course_id,
                "test_type": test_type or "ALL"
            },
            "chart": chart_data,
            "summary": {
                "total_raised": total_raised,
                "total_solved": total_solved,
                "resolution_rate": resolution_rate
            },
            "average_resolution_time_hours": avg_hours
        })

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
        except Exception:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)


    @action(detail=True, methods=['PATCH'], permission_classes=[IsFaculty],
        serializer_class=SetTimeSlotSerializer, url_path='set-time-slot')
    def set_time_slot(self, request, pk=None):
        doubt = Doubt.get_doubt_by_id(pk)

        if doubt.faculty_id != request.user.id:
            return Response({"detail": "You are not assigned to this doubt."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(doubt, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
            new_slot = serializer.validated_data['scheduled_slot']
            old_slot = doubt.scheduled_slot

            serializer.save()

            if old_slot and old_slot != new_slot:
                old_slot.release()
            new_slot.book()

            notification_params = {
                NotificationTemplate.USER_NAME: doubt.student.name,
                NotificationTemplate.REFERENCE_ID: doubt.id,
                NotificationTemplate.SCHEDULED_MEETING_TIME: (
                    f"{new_slot.date.strftime('%Y-%m-%d')} {new_slot.start_time.strftime('%H:%M')}"
                ),
            }
            send_notification.delay(
                notification_name=Notification.DOUBT_SCHEDULED_NOTIFICATION,
                params=notification_params,
                user_id=doubt.student.id
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
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



class FacultyTimeSlotViewSet(viewsets.ModelViewSet):
    queryset = FacultyTimeSlot.objects.all()
    serializer_class = FacultyTimeSlotSerializer
    logger = logging.getLogger('FacultyTimeSlot')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateFacultyTimeSlotSerializer
        return FacultyTimeSlotSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsFaculty()]
        return [IsAdminOrMentorOrFaculty()]

    def create(self, request, *args, **kwargs):
        data = request.data
        data['faculty'] = request.user.id
        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            slot = serializer.save()
            return Response(FacultyTimeSlotSerializer(slot).data, status=status.HTTP_201_CREATED)
        except Exception:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    def destroy(self, request, *args, **kwargs):
        slot = self.get_object()
        if slot.faculty_id != request.user.id:
            return Response({"detail": "Access Denied"}, status=status.HTTP_403_FORBIDDEN)
        if slot.is_booked:
            return get_error_response("Cannot delete a slot that is already booked.")
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrMentorOrFaculty], url_path='available')
    def available(self, request):
        faculty_id = request.query_params.get('faculty_id')
        date = request.query_params.get('date')
        if not faculty_id:
            return Response({"error": "faculty_id is required."}, status=400)
        slots = FacultyTimeSlot.get_available_slots(faculty_id=faculty_id, date=date)
        return Response(FacultyTimeSlotSerializer(slots, many=True).data)

    def list(self, request, *args, **kwargs):
        filterset = FacultyTimeSlotFilter(request.GET, queryset=self.queryset)
        if not filterset.is_valid():
            return Response({"detail": "Invalid filter parameters"}, status=status.HTTP_400_BAD_REQUEST)
        paginator = CustomPageNumberPagination()
        paginated = paginator.paginate_queryset(filterset.qs, request)
        return paginator.get_paginated_response(FacultyTimeSlotSerializer(paginated, many=True).data)


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
    # ✅ FILTER + SORT + SEARCH
    filter_backends = [
        DjangoFilterBackend,
        drf_filters.OrderingFilter,
        drf_filters.SearchFilter
    ]

    filterset_class = SuggestionFilter

    search_fields = [
        'question__description',
        'status',
        'created_by__name',
        'question__course_subject__course__name',  # ✅ FIXED
    ]

    # ✅ IMPORTANT: use REAL DB paths (NO alias here)
    ordering_fields = [
        'created_at',
        'status',
        'created_by__name',

        # ✅ FIXED RELATIONS
        'question__course_subject__course__name',
        'question__course_subject__subject__name',

        'question__difficulty',
        'question__srno',
        'question__description',
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
        print("ORDERING PARAM:", request.GET.get("ordering"))

        queryset = self.filter_queryset(self.get_queryset())

        print("FINAL QUERY:", queryset.query)  # debug

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
