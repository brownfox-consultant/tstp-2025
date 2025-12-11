import logging
import random
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.db import transaction
from django.middleware.csrf import get_token, _unmask_cipher_token
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from user_manager.models import User

from course_manager.models import Course, CourseEnrollment
from notification_manager.models import Notification, NotificationTemplate
from notification_manager.utils import send_notification
from sTest.permissions import IsAdmin, ChangePasswordPermission, IsAdminOrMentorOrFaculty
from sTest.utils import get_error_response_for_serializer, CustomPageNumberPagination, get_error_response
from .filters import UserFilter
from .models import Role, User, TempUser, StudentMetadata, PasswordResetToken
from .serializers import UserSerializer, TempUserSerializer, UserCreationSerializer, \
    ApproveStudentSubscriptionSerializer, ChangePasswordSerializer, LoginSerializer, RoleSerializer, \
    UserUpdateSerializer, StudentUpdateSerializer
from .utils import generate_secure_password, send_password_reset_link
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from django.http import HttpResponse
import csv
from test_manager.models import Test, Section, TestSubmission, Result, PracticeTest, PracticeTestResult, \
    AnsweredQuestions, TestFeedback, QuestionAnswer, SectionStats, PracticeQuestionAnswer,SelectionHistory
from test_manager.serializers import TestSerializer, TestListSerializer, ExistingStudentListSerializer, \
    TestSubmissionSerializer, PracticeTestListSerializer, EligibleStudentSerializer, SectionSerializer, \
    TestFeedbackSerializer
from course_manager.models import Question, CourseSubjects, CombinedScore
from test_manager.utils import calculate_total_questions_required



class UserViewSet(viewsets.ModelViewSet):
    queryset = User.get_all()
    serializer_class = UserSerializer
    logger = logging.getLogger('Users')

    from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.get_all()
    serializer_class = UserSerializer
    logger = logging.getLogger('Users')
    filter_backends = [DjangoFilterBackend]
    filterset_class = UserFilter
    # ... your existing code ...

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin], url_path='status')
    def update_status(self, request, pk=None):
        """
        Activate / Deactivate a user.
        Example request:
        PATCH /api/user/5/status/
        { "is_active": true }
        """ 
        print("pk",pk)
        try:
            user = User.objects.get(id=pk) 
            print("user",user)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        is_active = request.data.get('is_active')
        if is_active is None:
            return Response({'error': 'Missing is_active field'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = bool(is_active)
        user.save(update_fields=['is_active'])

        return Response(
            {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"},
            status=status.HTTP_200_OK
        )
    

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin], url_path='export')
    def export_users(self, request):
        role = request.query_params.get("role", None)

        if role:
            users = User.filter_users_by_role(role_id=role)
        else:
            users = User.filter_users_excluding_role(role_id=Role.get_role_using_name("admin").id)

    # Apply filters (optional)
        filterset = UserFilter(request.GET, queryset=users)
        if not filterset.is_valid():
            return get_error_response("Invalid filter parameters")

        users = filterset.qs

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=users_export.csv"
        writer = csv.writer(response)

        writer.writerow(["Role", "Name", "Email", "Phone Number", "Status"])

        for user in users:
            writer.writerow([
                user.role.name if user.role else "",
                user.name,
                user.email,
                user.phone_number,
                "Active" if user.is_active else "Inactive",
            ])

        # Nested export for Students
            if user.role and user.role.name == "student":
                try:
                    metadata = StudentMetadata.objects.get(student=user)

                    # Faculties (if many-to-many)
                    if hasattr(metadata, "faculties"):
                        for faculty in metadata.faculties.all():
                            writer.writerow([
                                "  -> Faculty",
                                faculty.name,
                                faculty.email,
                                faculty.phone_number,
                                ""
                            ])

                    # Other related fields
                    nested_rows = [
                        ("Mentor", getattr(metadata, "mentor", None)),
                        ("Parent", getattr(metadata, "father", None)),
                        ("Parent", getattr(metadata, "mother", None)),
                    ]
                    for nested_role, nested_user in nested_rows:
                        if nested_user:
                            writer.writerow([
                                f"  -> {nested_role}",
                                nested_user.name,
                                nested_user.email,
                                nested_user.phone_number,
                                ""
                            ])

                except StudentMetadata.DoesNotExist:
                    continue

        return response

    @action(detail=False, methods=['get'], url_path='content-developers-admins', permission_classes=[IsAdmin])
    def get_content_developers_and_admins(self, request):
        roles = Role.objects.filter(name__in=["content_developer", "admin"])
        if not roles.exists():
            return Response({"error": "Roles not found"}, status=status.HTTP_404_NOT_FOUND)

        users = User.objects.filter(role__in=roles, is_active=True).only("id", "name", "email", "phone_number", "role")

        user_data = [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone_number": user.phone_number,
                "role": user.role.name if user.role else None
            }
            for user in users
        ]
        return Response(user_data, status=status.HTTP_200_OK)

    

    @action(detail=False, methods=['get'], url_path='students-list')
    def get_all_students(self, request):
        students = User.objects.filter(role_id=5, is_active=True).only('id', 'name')
        student_data = [{'id': student.id, 'name': student.name} for student in students]
        return Response(student_data, status=status.HTTP_200_OK) 

    @action(detail=False, methods=['get'], url_path='student-count-by-course', permission_classes=[IsAuthenticated])
    def student_count_by_course(self, request):
        courses = Course.objects.all()
        data = []

        for course in courses:
            student_count = CourseEnrollment.objects.filter(course=course).count()
            data.append({
                "course_name": course.name,
                "student_count": student_count
            })

        return Response(data)


    @permission_classes([IsAdmin])
    def create(self, request, *args, **kwargs):
        serializer = UserCreationSerializer(data=request.data)
        print("request.data",request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            details_serializer = UserSerializer(user)
            return Response(details_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Serializer errors:", serializer.errors)
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @permission_classes([IsAdmin])
    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # ------------------------------
        # 1) UPDATE BASIC USER FIELDS
        # ------------------------------
        user_serializer = UserUpdateSerializer(
            instance,
            data=request.data,
            partial=True
        )

        if not user_serializer.is_valid():
            return get_error_response_for_serializer(
                logger=self.logger,
                serializer=user_serializer,
                data=request.data
            )

        user_serializer.save()

        # --------------------------------------
        # 2) STUDENT EXTRA UPDATES (COURSES / PARENTS)
        # --------------------------------------
        if instance.role.name == 'student':
            student_metadata = StudentMetadata.objects.filter(student=instance).first()

            # ---------------------------
            # 2A) UPDATE COURSES / FACULTIES / MENTOR
            # ---------------------------
            student_update_serializer = StudentUpdateSerializer(
                instance,
                data=request.data,
                partial=True
            )

            if student_update_serializer.is_valid():
                student_update_serializer.update(
                    instance,
                    student_update_serializer.validated_data
                )
            else:
                return get_error_response_for_serializer(
                    logger=self.logger,
                    serializer=student_update_serializer,
                    data=request.data
                )

            # --------------------------------------
            # 2B) FATHER UPDATE / CREATE
            # --------------------------------------
            if request.data.get("father_email"):
                if student_metadata.father is None:
                    father_resp = self._create_parent_user(request.data, "father")
                    if "error" in father_resp:
                        return get_error_response(father_resp["error"])
                    student_metadata.father = father_resp["user"]
                else:
                    father = student_metadata.father
                    father.email = request.data.get("father_email")
                    father.phone_number = request.data.get("father_phone_number")
                    father.name = request.data.get("father_name")
                    father.save()

            # --------------------------------------
            # 2C) MOTHER UPDATE / CREATE
            # --------------------------------------
            if request.data.get("mother_email"):
                if student_metadata.mother is None:
                    mother_resp = self._create_parent_user(request.data, "mother")
                    if "error" in mother_resp:
                        return get_error_response(mother_resp["error"])
                    student_metadata.mother = mother_resp["user"]
                else:
                    mother = student_metadata.mother
                    mother.email = request.data.get("mother_email")
                    mother.phone_number = request.data.get("mother_phone_number")
                    mother.name = request.data.get("mother_name")
                    mother.save()

            student_metadata.save()

        # --------------------------------------
        # RETURN RESPONSE
        # --------------------------------------
        return Response(user_serializer.data)



    @permission_classes([IsAdmin])
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        # instance.is_active = False
        # instance.updated_at = timezone.now()
        # instance.save()
        instance.delete()

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin], url_path='deactivate')
    def deactivate_user(self, request, pk=None):
        user = User.get_user_by_id(user_id=pk)
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def session_validate(self, request):
        """
            Custom action to check if the user's session is still valid.
        """
        # If the request reaches this point, the user is authenticated
        user = request.user
        response = LoginSerializer(user).data
        response['csrf_token'] = _unmask_cipher_token(get_token(request))
        return Response(data=response, status=status.HTTP_200_OK)


    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            response = LoginSerializer(user).data
            response['csrf_token'] = _unmask_cipher_token(get_token(request))
            return Response(data=response, status=status.HTTP_200_OK)
        else:
            self.logger.exception("Invalid credentials provided")
            response = {
                'detail': 'Invalid credentials'
            }
            return Response(data=response, status=status.HTTP_401_UNAUTHORIZED)

    
    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        
        logout(request)
        return Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'], permission_classes=[AllowAny])
    def roles(self, request):
        roles = Role.get_all()
        roles_data = RoleSerializer(roles, many=True).data
        return Response(data=roles_data, status=status.HTTP_200_OK)

    @permission_classes([IsAdminOrMentorOrFaculty])
    def list(self, request):
        user = request.user

        # Role-based user selection
        if user.role.name == 'faculty':
            sm = StudentMetadata.objects.filter(faculties=user)
            users = User.filter_users_using_id_and_role(
                user_ids=sm.values_list('student', flat=True),
                role=Role.get_role_using_name('student').id
            )
        elif user.role.name == 'mentor':
            sm = StudentMetadata.objects.filter(mentor=user)
            users = User.filter_users_using_id_and_role(
                user_ids=sm.values_list('student', flat=True),
                role=Role.get_role_using_name('student').id
            )
        elif user.role.name == 'admin':
            role = request.query_params.get('role', None)
            if role:
                users = User.filter_users_by_role(role_id=role)
            else:
                users = User.filter_users_excluding_role(
                    role_id=Role.get_role_using_name('admin').id
                )
        else:
            users = User.objects.none()

        # Apply filtering and search
        filterset = UserFilter(request.GET, queryset=users)
        if not filterset.is_valid():
            return get_error_response('Invalid filter parameters')

        filtered_users = filterset.qs

        # Safe ordering mapping
        ORDERING_MAP = {
        "name": "name",
        "email": "email",
        "phone_number": "phone_number",
        "role_label": "role__name",
        "is_active": "is_active",
        "subscription_type": "course_enrollments__subscription_type", 

    }

        ordering_param = request.GET.get("ordering")
        if ordering_param:
            ordering_fields = []
            for field in ordering_param.split(","):
                desc = field.startswith("-")
                key = field[1:] if desc else field
                model_field = ORDERING_MAP.get(key)
                if model_field:
                    ordering_fields.append(f"-{model_field}" if desc else model_field)
            if ordering_fields:
                filtered_users = filtered_users.order_by(*ordering_fields)


        # Pagination
        paginator = CustomPageNumberPagination()
        paginated_users = paginator.paginate_queryset(filtered_users, request)
        serializer = UserSerializer(paginated_users, many=True)

        return paginator.get_paginated_response(serializer.data)

    
    @permission_classes([IsAuthenticated])
    def retrieve(self, request, pk=None):
        user = request.user
        if user.role.name == 'admin':
            user = User.get_user_by_id(user_id=pk)
        serializer = UserSerializer(user)
        return Response(data=serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], permission_classes=[IsAdmin],
            url_path='approve_student_subscription')
    def approve_student_subscription(self, request):
        serializer = ApproveStudentSubscriptionSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            is_temp_user = data['is_temp_user']
            student_metadata = None

            if is_temp_user:
                student_metadata = self._process_temp_user(data)
            else:
                student_metadata = self._update_existing_student_metadata(data)

            if 'error' in student_metadata:
                return get_error_response(student_metadata['error'])

            return Response(data={'detail': 'Student subscription approved successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request.data)

    @action(detail=False, methods=['POST'], permission_classes=[ChangePasswordPermission])
    def change_password(self, request, pk=None):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return get_error_response("Wrong password provided.")
            # set_password also hashes the password that the user will get
            user.set_change_password(False)
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            login(request, user)
            response = LoginSerializer(user).data
            response['csrf_token'] = _unmask_cipher_token(get_token(request))
            return Response(data=response, status=status.HTTP_200_OK)
        except Exception as e:
            return get_error_response_for_serializer(logger=self.logger, serializer=serializer, data=request)

    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin], url_path='upcoming-subscription-or-free')
    def upcoming_subscription_or_free(self, request, pk=None):
        
        upcoming_month_date = datetime.now().date() + timedelta(days=30)

        # Filter student role users
        student_role_users = User.filter_users_by_role(role_id=Role.get_role_using_name('student').id)

        # Fetch CourseEnrollment instances meeting the criteria
        qualified_enrollments = CourseEnrollment.objects.filter(
            student__in=student_role_users,
            subscription_end_date__lte=upcoming_month_date
        ) | CourseEnrollment.objects.filter(
            student__in=student_role_users,
            subscription_type=CourseEnrollment.FREE
        )

        # Distinctly select students
        qualified_students = User.objects.filter(
            id__in=qualified_enrollments.values_list('student', flat=True)
        ).distinct()

        search = request.query_params.get("search", "").strip().lower()
        if search:
            qualified_students = qualified_students.filter(
             Q(name__icontains=search) |
             Q(email__icontains=search) |
             Q(phone_number__icontains=search)
        )
        # Apply pagination
        paginator = CustomPageNumberPagination()
        paginator.page_size = 10
        paginated_users = paginator.paginate_queryset(qualified_students, request)

        serializer = UserSerializer(paginated_users, many=True)

        # Return the paginated response
        return paginator.get_paginated_response(serializer.data)

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        email = request.data.get('email')
        print("email",email)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return get_error_response('User not found.')

        try:
            existing_reset_token = PasswordResetToken.objects.get(user=user, used=False)
            if existing_reset_token is not None:
                existing_reset_token.used = True
                existing_reset_token.save()
        except PasswordResetToken.DoesNotExist:
            pass

        # Create a password reset token
        password_reset_token = PasswordResetToken.objects.create(user=user,
                                                                 expires_at=timezone.now() + timedelta(hours=1))

        # Construct the password reset link
        reset_link = f'{settings.FRONTEND_URL}/reset-password?token={password_reset_token.token}'

        # Send notification
        notification_params = {NotificationTemplate.RESET_LINK: reset_link}
        print(Notification.FORGOT_PASSWORD_NOTIFICATION,notification_params,user.id)
        send_notification.delay(notification_name=Notification.FORGOT_PASSWORD_NOTIFICATION,
                                params=notification_params,
                                user_id=user.id)

        return Response({"detail": "Password reset email sent."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def reset_password(self, request):
        token = request.data.get('token')
        password = request.data.get('password')

        try:
            password_reset_token = PasswordResetToken.objects.get(token=token, used=False)
        except PasswordResetToken.DoesNotExist:
            return get_error_response('Invalid or expired token.')

        if password_reset_token.is_expired():
            return get_error_response('Token has expired.')

        user = password_reset_token.user
        user.set_password(password)
        user.change_password = False
        user.save()

        password_reset_token.used = True
        password_reset_token.save()

        return Response(status=status.HTTP_200_OK)

    @transaction.atomic
    def _process_temp_user(self, data):
        temp_user_data = TempUser.get_temp_user_using_id(data['student'])

        user_data = {
            'email': temp_user_data.email,
            'phone_number': temp_user_data.phone_number,
            'name': temp_user_data.name,
            'role': Role.get_role_using_name('student').id,
        }
        user_serializer = UserSerializer(data=user_data)

        try:
            user_serializer.is_valid(raise_exception=True)
            user = user_serializer.save()
            user.set_password(temp_user_data.password)
            user.save()
        except Exception as e:
            error = ''
            for field_name, field_errors in user_serializer.errors.items():
                error += str.capitalize(field_errors[0]) + '<br/>'
            return {'error': error}

        # ✅ Faculties (plural) instead of faculty
        faculty_ids = data.get("faculties", [])
        faculties = User.objects.filter(id__in=faculty_ids) if faculty_ids else []

        # ✅ Mentor
        mentor = None
        if data.get("mentor"):
            mentor = User.get_user_by_id(data["mentor"])

        # ✅ Parents
        try:
            parent_user_data = self._prepare_parent_data(data=data, is_temp_user=True)
        except serializers.ValidationError as e:
            return {'error': str(e)}

        # ✅ StudentMetadata creation
        student_metadata = StudentMetadata.create_metadata(
            student=user,
            mentor=mentor,
            faculties=faculties,
            **parent_user_data
        )

        # ✅ Courses
        for course_data in data['courses']:
            course = Course.objects.get(name=course_data['course'])
            CourseEnrollment.objects.create(
                student=user,
                course=course,
                subscription_start_date=course_data['subscription_start_date'],
                subscription_end_date=course_data['subscription_end_date'],
                subscription_type=course_data['subscription_type']
            )

        # Delete temp user after migration
        temp_user_data.delete()
        return {"detail": "Student subscription approved successfully"}


    def _prepare_parent_data(self, data, is_temp_user):
        parent_user_data = {}
        if 'father_id' in data or 'mother_id' in data or 'father_email' in data or 'mother_email' in data:
            for parent_type in ['father', 'mother']:
                if f'{parent_type}_id' in data:
                    parent_user = User.get_user_by_id(data[f'{parent_type}_id'])
                    parent_user_data[parent_type] = parent_user
                elif f'{parent_type}_email' in data:
                    parent_creation_response = self._create_parent_user(data, parent_type)
                    if 'error' in parent_creation_response:
                        raise serializers.ValidationError(parent_creation_response['error'])
                    parent_user_data[parent_type] = parent_creation_response['user']
        elif is_temp_user:
            raise serializers.ValidationError(
                "At least one of father or mother details are required for a temporary user.")

        return parent_user_data

    def _create_parent_user(self, data, parent_type):
        # Common code to create parent user (either father or mother)
        parent_user_data = {
            'email': data[f'{parent_type}_email'],
            'phone_number': data[f'{parent_type}_phone_number'],
            'name': data[f'{parent_type}_name'],
            'role': Role.get_role_using_name('parent').id,
        }
        parent_user_serializer = UserSerializer(data=parent_user_data)

        try:
            parent_user_serializer.is_valid(raise_exception=True)
            parent_user = parent_user_serializer.save()
            parent_user.set_change_password(True)
            parent_user.set_password(generate_secure_password())
            parent_user.save()

            send_password_reset_link(parent_user)
            return {'user': parent_user}
        except Exception as e:
            error = f'{str.capitalize(parent_type)} - '
            for field_name, field_errors in parent_user_serializer.errors.items():
                try:
                    if len(field_errors) > 1:
                        for sub_field in field_errors:
                            for dict_field_name, dict_field_errors in sub_field.items():
                                error += str.capitalize(dict_field_name) + ': ' + str.capitalize(
                                    dict_field_errors[0]) + '<br/>'
                    else:
                        error += str.capitalize(field_name) + ': ' + str.capitalize(field_errors[0]) + '<br/>'
                except Exception as e:
                    self.logger.info(f'Error processing error for - {field_name} because of {e}')
            if error == '':
                error = 'Oops! Something went wrong.'
            return {'error': error}


    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='get-user-by-id')
    def get_user_by_id(self, request):
        user_id = request.query_params.get('user_id')

        if not user_id:
            return get_error_response('Missing user ID.')

        try:
            user = User.get_user_by_id(user_id=user_id)
        except User.DoesNotExist:
            return get_error_response('User not found.')

        # Get user details
        user_data = UserSerializer(user).data

        # Add extra fields if needed
        user_data['dob'] = user.dob.isoformat() if user.dob else None
        user_data['role_name'] = user.role.name if user.role else ''
        user_data['address'] = user.address if user.address else ''
        user_data['course_details'] = []

        course_enrollments = CourseEnrollment.objects.filter(student=user)
        for enrollment in course_enrollments:
            user_data['course_details'].append({
                'course': {
                    'id': enrollment.course.id,
                    'name': enrollment.course.name
                },
                'subscription_start_date': enrollment.subscription_start_date,
                'subscription_end_date': enrollment.subscription_end_date,
                'subscription_type': enrollment.subscription_type,
            })

        return Response(user_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='update-user')
    def update_user(self, request):
        print("Received data:", request.data)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'Missing user_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        print("Updating user:", user)

        # Update name
        user.name = request.data.get('name', user.name)

        # Email
        new_email = request.data.get('email')
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exclude(id=user_id).exists():
                return Response({'error': 'Email already in use by another user'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email

        # Phone number
        new_phone = request.data.get('phone_number')
        if new_phone and new_phone != user.phone_number:
            if User.objects.filter(phone_number=new_phone).exclude(id=user_id).exists():
                return Response({'error': 'Phone number already in use by another user'}, status=status.HTTP_400_BAD_REQUEST)
            user.phone_number = new_phone

        # Other profile fields
        user.dob = request.data.get('dob', user.dob)
        user.blood_group = request.data.get('blood_group', user.blood_group)
        user.address = request.data.get('address', user.address)
        user.save()

        # Handle course enrollments
        new_course_ids = request.data.get('courses', [])
        print("Course IDs received:", new_course_ids)

        if isinstance(new_course_ids, list):
            # Get currently enrolled course IDs
            existing_enrollments = CourseEnrollment.objects.filter(student=user)
            existing_course_ids = set(existing_enrollments.values_list('course_id', flat=True))
            new_course_ids_set = set(new_course_ids)

            # Courses to add
            to_add = new_course_ids_set - existing_course_ids
            # Courses to remove
            to_remove = existing_course_ids - new_course_ids_set

            # Remove enrollments not in new list
            CourseEnrollment.objects.filter(student=user, course_id__in=to_remove).delete()

            # Add new enrollments
            for course_id in to_add:
                try:
                    course = Course.objects.get(id=course_id)
                    CourseEnrollment.objects.create(
                        student=user,
                        course=course,
                        subscription_start_date=None,  # Or assign actual dates
                        subscription_end_date=None,
                        subscription_type=CourseEnrollment.FREE
                    )
                except Course.DoesNotExist:
                    print(f"Course with ID {course_id} does not exist")
                    continue

        return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)


    @transaction.atomic
    def _update_existing_student_metadata(self, data):
        student_metadata = StudentMetadata.get_student_metadata_using_id(data['student'])

        if 'faculty' not in data:
            faculty = None
        else:
            faculty = User.get_user_by_id(data['faculty'])
        if 'mentor' not in data:
            mentor = None
        else:
            mentor = User.get_user_by_id(data['mentor'])

        student_metadata.update_metadata(
            faculty=faculty,
            mentor=mentor
        )

        try:
            if 'father_email' in data:
                if student_metadata.father is None:
                    father_creation_response = self._create_parent_user(data=data, parent_type='father')
                    if 'error' in father_creation_response:
                        raise Exception(father_creation_response['error'])

                    father_user = father_creation_response['user']
                    student_metadata.update_metadata(father=father_user)
                else:
                    father_user = student_metadata.father
                    father_user.email = data['father_email']
                    father_user.phone_number = data['father_phone_number']
                    father_user.name = data['father_name']
                    father_user.save()
            elif 'father_id' in data:
                father_user = User.get_user_by_id(data['father_id'])
                student_metadata.father = father_user
                student_metadata.save()

            if 'mother_email' in data:
                if student_metadata.mother is None:
                    mother_creation_response = self._create_parent_user(data=data, parent_type='mother')
                    if 'error' in mother_creation_response:
                        raise serializers.ValidationError(mother_creation_response['error'])

                    mother_user = mother_creation_response['user']
                    student_metadata.update_metadata(mother=mother_user)
                else:
                    mother_user = student_metadata.mother
                    mother_user.email = data['mother_email']
                    mother_user.phone_number = data['mother_phone_number']
                    mother_user.name = data['mother_name']
                    mother_user.save()
            elif 'mother_id' in data:
                mother_user = User.get_user_by_id(data['mother_id'])
                student_metadata.mother = mother_user
                student_metadata.save()
        except Exception as e:
            return {'error': str(e)}

        CourseEnrollment.objects.filter(student=student_metadata.student).delete()
        for course_data in data['courses']:
            course = Course.objects.get(name=course_data['course'])
            CourseEnrollment.objects.create(
                student=student_metadata.student,
                course=course,
                subscription_start_date=course_data['subscription_start_date'],
                subscription_end_date=course_data['subscription_end_date'],
                subscription_type=course_data['subscription_type']
            )

        return {'Student subscription approved successfully'}


class TempUserViewSet(viewsets.ModelViewSet):
    queryset = TempUser.get_all()
    serializer_class = TempUserSerializer
    logger = logging.getLogger('Temp User')

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny], url_path='register')
    def register(self, request):
        serializer = None  # avoid UnboundLocalError

        try:
            email = request.data.get("email")
            phone = request.data.get("phone_number")

            # Check if a temp user already exists
            existing_user = TempUser.objects.filter(email=email).first()

            if existing_user:

                # Use is_active as verification flag
                if not existing_user.is_active:
                    # RESEND OTP
                    otp = random.randint(100000, 999999)
                    cache.set(f"otp_{email}", otp, timeout=600)

                    notification_params = {
                        NotificationTemplate.USER_NAME: existing_user.name,
                        NotificationTemplate.OTP: str(otp),
                    }
                    send_notification.delay(
                        notification_name=Notification.REGISTRATION_OTP_NOTIFICATION,
                        params=notification_params,
                        user_id=existing_user.id,
                    )

                    return Response(
                        {"message": "User already exists but not verified. OTP resent."},
                        status=status.HTTP_200_OK
                    )

                # If verified → registration not allowed
                return Response(
                    {"detail": "User already registered."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ────────────────────────────────
            # CREATE NEW TEMP USER
            # ────────────────────────────────
            serializer = TempUserSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            user_instance = serializer.save()

            # Save password
            password = request.data.get("password")
            user_instance.set_password(password)
            user_instance.save()

            # Generate OTP
            otp = random.randint(100000, 999999)
            cache.set(f"otp_{email}", otp, timeout=600)

            # Send OTP
            notification_params = {
                NotificationTemplate.USER_NAME: request.data.get("name"),
                NotificationTemplate.OTP: str(otp),
            }
            send_notification.delay(
                notification_name=Notification.REGISTRATION_OTP_NOTIFICATION,
                params=notification_params,
                user_id=user_instance.id,
            )

            return Response(
                {"message": "OTP sent to email. Please verify to complete registration."},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            print("Registration Error:", e)
            return get_error_response_for_serializer(
                logger=self.logger,
                serializer=serializer,
                data=request.data
            )


    # @action(detail=False, methods=['POST'], permission_classes=[AllowAny], url_path='verify-otp')
    # def verify_otp(self, request):
    #     email = request.data.get('email')
    #     user_otp = request.data.get('otp')

    #     if not email or not user_otp:
    #         return get_error_response('Email and OTP are required')

    #     stored_otp = cache.get(f"otp_{email}")

    #     if stored_otp is None:
    #         return get_error_response('OTP has expired or is invalid')

    #     if str(user_otp) == str(stored_otp):
    #         temp_user = TempUser.objects.get(email=email)
    #         temp_user.is_active = True
    #         temp_user.save()

    #         notification_params = {NotificationTemplate.USER_NAME: temp_user.name}

    #         send_notification.delay(notification_name=Notification.REGISTRATION_NOTIFICATION,
    #                                 params=notification_params,
    #                                 user_id=temp_user.id)

    #         return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
    #     else:
    #         return get_error_response('Invalid OTP')

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny], url_path='verify-otp')
    @transaction.atomic
    def verify_otp(self, request):
        email = request.data.get('email')
        user_otp = request.data.get('otp')

        if not email or not user_otp:
            return get_error_response('Email and OTP are required')

        stored_otp = cache.get(f"otp_{email}")

        if stored_otp is None:
            return get_error_response('OTP has expired or is invalid')

        if str(user_otp) != str(stored_otp):
            return get_error_response('Invalid OTP')

        # -------------------------------
        # GET TEMP USER
        # -------------------------------
        temp_user = TempUser.objects.get(email=email)

        # -------------------------------
        # CONVERT TEMP → USER
        # -------------------------------
        student_role = Role.objects.get(name="student")

        new_user = User.objects.create(
            email=temp_user.email,
            phone_number=temp_user.phone_number,
            name=temp_user.name,
            role=student_role
        )

        # Password must be reset by student
        new_user.set_password(generate_secure_password())
        new_user.change_password = True
        new_user.save()

        # TEMP USER NOT NEEDED ANYMORE
        temp_user.delete()

        # -------------------------------
        # FREE 7-DAY SUBSCRIPTION
        # -------------------------------
        start_date = timezone.now().date()
        end_date = start_date + timedelta(days=7)

        free_course = Course.objects.filter(name="DSAT - Scholarship Test").first()
        if not free_course:
            return get_error_response("Course 'DSAT - Scholarship Test' not found.")

        CourseEnrollment.objects.create(
            student=new_user,
            course=free_course,
            subscription_start_date=start_date,
            subscription_end_date=end_date,
            subscription_type=CourseEnrollment.FREE
        )

        # -------------------------------
        # CREATE PASSWORD RESET TOKEN
        # -------------------------------
        PasswordResetToken.objects.filter(user=new_user, used=False).update(used=True)

        reset_token = PasswordResetToken.objects.create(
            user=new_user,
            expires_at=timezone.now() + timedelta(hours=1)
        )

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token.token}"

        # SEND RESET EMAIL
        notification_params = {
            NotificationTemplate.USER_NAME: new_user.name,
            NotificationTemplate.RESET_LINK: reset_link,
        }
        send_notification.delay(
            notification_name=Notification.FORGOT_PASSWORD_NOTIFICATION,
            params=notification_params,
            user_id=new_user.id
        )

        # SEND WELCOME NOTIFICATION
        send_notification.delay(
            notification_name=Notification.REGISTRATION_NOTIFICATION,
            params={NotificationTemplate.USER_NAME: new_user.name},
            user_id=new_user.id
        )

        # -------------------------------
        # AUTO CREATE OR FETCH FREE TEST
        # -------------------------------
        test_name = "DSAT-Scholarship Test - Free"
        test = Test.objects.filter(name=test_name).first()

        if not test:
            # Create a dynamic test automatically
            default_course = free_course

            test_data = {
                "name": test_name,
                "test_type": Test.EXAM,
                "format_type": Test.DYNAMIC,
                "course": default_course.id,
                "is_free_test": True,
                "created_by": 1,  # System/admin ID or request.user.id
                "updated_by": 1
            }

            test_serializer = TestSerializer(data=test_data)
            test_serializer.is_valid(raise_exception=True)

            validated = test_serializer.validated_data
            course_subjects = CourseSubjects.get_subjects_for_course(validated['course'])

            # Validate question availability
            for cs in course_subjects:
                required = calculate_total_questions_required(cs)
                available = Question.objects.filter(course_subject=cs).count()

                if available < required:
                    return get_error_response(
                        f"Insufficient questions for subject {cs.subject.name}. Required {required}, Available {available}"
                    )

            test = test_serializer.save()

        # -------------------------------
        # ASSIGN TEST TO STUDENT
        # -------------------------------
        assigned_date = timezone.now()
        expiration_date = assigned_date + timedelta(hours=48)

        test_submission = TestSubmission.objects.create(
            test=test,
            student=new_user,
            assigned_date=assigned_date,
            expiration_date=expiration_date
        )

        # NOTIFY STUDENT ABOUT TEST
        notification_params = {
            NotificationTemplate.USER_NAME: new_user.name,
            NotificationTemplate.TEST_NAME: test.name,
            NotificationTemplate.REFERENCE_ID: test_submission.id,
        }

        send_notification.delay(
            notification_name=Notification.TEST_ASSIGNED_NOTIFICATION,
            params=notification_params,
            user_id=new_user.id
        )

        return Response(
            {
                "message": "User verified successfully. Free 7-day access activated, Free Test assigned, Password reset link sent."
            },
            status=status.HTTP_200_OK
        )




    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin], url_path='registered')
    # def registered_users(self, request):
    #     temp_users = TempUser.get_all()

    #     # Apply pagination
    #     paginator = CustomPageNumberPagination()
    #     paginator.page_size = 15
    #     paginated_temp_users = paginator.paginate_queryset(temp_users, request)

    #     serializer = TempUserSerializer(paginated_temp_users, many=True)

    #     # Return the paginated response
    #     return paginator.get_paginated_response(serializer.data)
    
    def registered_users(self, request):
        temp_users = TempUser.get_all()
    
        search = request.query_params.get("search", "").strip().lower()
        if search:
            temp_users = temp_users.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
         )

    # Apply pagination
        paginator = CustomPageNumberPagination()
        paginator.page_size = 15
        paginated_temp_users = paginator.paginate_queryset(temp_users, request)

        serializer = TempUserSerializer(paginated_temp_users, many=True)
        return paginator.get_paginated_response(serializer.data)