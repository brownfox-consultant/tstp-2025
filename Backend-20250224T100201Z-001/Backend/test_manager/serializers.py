from rest_framework import serializers

from course_manager.models import CourseEnrollment
from user_manager.models import User
from .models import Test, Section, TestSubmission, PracticeTestResult, PracticeTest, TestFeedback


class SectionSerializer(serializers.ModelSerializer):
    sections = serializers.JSONField(source='sub_sections')

    class Meta:
        model = Section
        fields = ['id', 'course_subject', 'name', 'order', 'sections']


class TestSerializer(serializers.ModelSerializer):
    subject = SectionSerializer(many=True, read_only=True, source='section_set')
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'course', 'course_name', 'name', 'test_type', 'format_type', 'created_at', 'updated_at',
                  'created_by', 'updated_by', 'subject', 'show_skip_button', 'show_prev_button']


class TestListSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'course', 'course_name', 'name', 'test_type', 'format_type', 'show_skip_button',
                  'show_prev_button', 'created_at', 'updated_at']


class TestSubmissionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='test.id', read_only=True)
    test_submission_id = serializers.IntegerField(source='id', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    course = serializers.CharField(source='test.course.id', read_only=True)
    course_name = serializers.CharField(source='test.course.name', read_only=True)
    name = serializers.CharField(source='test.name', read_only=True)
    test_type = serializers.CharField(source='test.test_type', read_only=True)
    format_type = serializers.CharField(source='test.format_type', read_only=True)
    show_skip_button = serializers.CharField(source='test.show_skip_button', read_only=True)
    show_prev_button = serializers.CharField(source='test.show_prev_button', read_only=True)

    assigned_date = serializers.DateTimeField(format="%b %d, %Y %I:%M %p")
    expiration_date = serializers.DateTimeField(format="%b %d, %Y %I:%M %p")
    completion_date = serializers.DateTimeField(format="%b %d, %Y %I:%M %p", required=False, allow_null=True)


    can_take_test = serializers.SerializerMethodField()

    class Meta:
        model = TestSubmission
        fields = ['id', 'test_submission_id', 'student_name', 'course', 'course_name', 'name', 'test_type',
                  'format_type', 'show_skip_button', 'show_prev_button', 'status', 'expiration_date', 'assigned_date',
                  'completion_date', 'can_take_test']

    def get_can_take_test(self, obj):
        # Logic to determine if the test can be taken
        user = self.context.get('user', None)
        if user and user.role.name == 'student':
            return self.is_eligible_for_student(obj, user)
        return False

    def is_eligible_for_student(self, test_submission, user):
        first_eligible_test = TestSubmission.objects.filter(
            student=user, status__in=[TestSubmission.YET_TO_START, TestSubmission.IN_PROGRESS]
        ).order_by('assigned_date').first()

        return test_submission == first_eligible_test

    def get_assigned_date(self, obj):
        return obj.assigned_date.strftime('%b %d, %Y') if obj.assigned_date else None

    def get_expiration_date(self, obj):
        return obj.expiration_date.strftime('%b %d, %Y') if obj.expiration_date else None

    def get_completion_date(self, obj):
        return obj.completion_date.strftime('%b %d, %Y') if obj.completion_date else None


class ExistingStudentListSerializer(serializers.ModelSerializer):
    test_submission_id = serializers.IntegerField(source='id', read_only=True)
    student_id = serializers.CharField(source='student.id', read_only=True)
    name = serializers.CharField(source='student.name', read_only=True)
    email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = TestSubmission
        fields = ['test_submission_id', 'student_id', 'name', 'email', 'status',
                  'assigned_date', 'expiration_date', 'completion_date']


class PracticeTestResultSerializer(serializers.ModelSerializer):
    correct_count = serializers.IntegerField(source='correct_answer_count')
    incorrect_count = serializers.IntegerField(source='incorrect_answer_count')
    time_taken = serializers.IntegerField()

    class Meta:
        model = PracticeTestResult
        fields = ['correct_count', 'incorrect_count', 'time_taken']


class PracticeTestListSerializer(serializers.ModelSerializer):
    correct_count = serializers.IntegerField(source='result.correct_answer_count', read_only=True)
    incorrect_count = serializers.IntegerField(source='result.incorrect_answer_count', read_only=True)
    time_taken = serializers.IntegerField(source='result.time_taken', read_only=True)
    student = serializers.CharField(source='student.name', read_only=True)
    course = serializers.CharField(source='course_subject.course.name', read_only=True)
    subject = serializers.CharField(source='course_subject.subject.name', read_only=True)
    created_at = serializers.DateTimeField(format="%b %d, %Y %I:%M %p", read_only=True)


    class Meta:
        model = PracticeTest
        fields = ['id', 'student', 'course', 'subject', 'created_at', 'result', 'correct_count', 'incorrect_count', 'time_taken']

    def get_created_at(self, obj):
        return obj.created_at.strftime('%b %d, %Y') if obj.created_at else None

class EligibleStudentSerializer(serializers.ModelSerializer):
    subscription_type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'subscription_type']

    def get_subscription_type(self, obj):
        request = self.context.get('request')
        if request:
            test_id = request.parser_context['kwargs'].get('pk', None)
            if test_id:
                test = Test.objects.filter(id=test_id).first()
                if test:
                    course_id = test.course_id
                    enrollment = CourseEnrollment.objects.filter(student=obj, course_id=course_id).first()
                    if enrollment:
                        return enrollment.get_subscription_type_display()
        return None


class TestFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestFeedback
        fields = ['id', 'rating', 'description', 'feedback_date', 'test_submission']

        extra_kwargs = {
            'test_submission': {'required': True}  # Ensure the test_submissions is required
        }

    def validate_rating(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Value must be between 1 and 10")
        return value

    def validate_description(self, value):
        if not value:
            raise serializers.ValidationError("Description is required")
        return value
