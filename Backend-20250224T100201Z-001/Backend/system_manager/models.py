from django.db import models

from course_manager.models import Question, CourseSubjects, Topic, SubTopic
from test_manager.models import Test
from user_manager.models import User
from django.contrib.postgres.fields import ArrayField


class Doubt(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, null=True, blank=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_doubt')
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    course_subject = models.ForeignKey(CourseSubjects, on_delete=models.CASCADE, null=True, blank=True)
    section = models.IntegerField( null=True, blank=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    description = models.TextField(null=False)

    RAISED = 'RAISED'
    ASSIGNED_TO_FACULTY = 'ASSIGNED_TO_FACULTY'
    RESOLVED = 'RESOLVED'
    STATUS_CHOICES = [
        (RAISED, 'Raised'),
        (ASSIGNED_TO_FACULTY, 'Assigned to faculty'),
        (RESOLVED, 'Resolved'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=RAISED)

    resolution = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    faculty_assigned_date = models.DateTimeField(null=True)
    resolution_date = models.DateTimeField(null=True)

    # ✅ New field to track who actually solved the doubt
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_doubts"
    )

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def get_doubt_by_id(cls, doubt_id):
        return cls.objects.get(pk=doubt_id)



class Issue(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_issues")
    description = models.TextField(null=False)

    RAISED = 'RAISED'
    RESOLVED = 'RESOLVED'
    STATUS_CHOICES = [
        (RAISED, 'Raised'),
        (RESOLVED, 'Resolved'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=RAISED)

    resolution = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolution_date = models.DateTimeField(null=True)

    # ✅ New field to track admin who resolved the issue
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_issues"
    )

    class Meta:
        ordering = ['-created_at']



class Concern(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(null=False)

    RAISED = 'RAISED'
    RESOLVED = 'RESOLVED'
    STATUS_CHOICES = [
        (RAISED, 'Raised'),
        (RESOLVED, 'Resolved'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=RAISED)

    resolution = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolution_date = models.DateTimeField(null=True)

    class Meta:
        ordering = ['-created_at']


class Meeting(models.Model):
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    requested_times = ArrayField(models.DateTimeField(), default=list)
    approved_time = models.DateTimeField(null=True)
    description = models.TextField(null=False)

    SCHEDULED = 'SCHEDULED'
    APPROVED = 'APPROVED'
    COMPLETED = 'COMPLETED'
    STATUS_CHOICES = [
        (SCHEDULED, 'Scheduled'),
        (APPROVED, 'Approved'),
        (COMPLETED, 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=SCHEDULED)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class Suggestion(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)

    description = models.TextField(null=False)
    question_type = models.CharField(max_length=30, choices=Question.QUESTION_TYPE)
    question_subtype = models.CharField(max_length=30, choices=Question.QUESTION_SUBTYPE,
                                        default=Question.MCQ_SINGLE_CHOICE_QUESTION)

    reading_comprehension_passage = models.TextField(null=True, blank=True)

    # The options JSONField, structure depends on question type
    options = models.JSONField(default=dict)

    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True)
    sub_topic = models.ForeignKey(SubTopic, on_delete=models.SET_NULL, null=True, blank=True)
    show_calculator = models.BooleanField(default=False)
    difficulty = models.CharField(max_length=15, choices=Question.DIFFICULTY_CHOICES)
    test_type = models.CharField(max_length=20, choices=Question.TEST_TYPE_CHOICES)
    directions = models.TextField(null=True, blank=True)
    explanation = models.TextField(null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    STATUS_CHOICES = [
        (IN_REVIEW, 'In Review'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=IN_REVIEW)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def get_all(cls):
        return cls.objects.all()

    @classmethod
    def get_suggestion_by_id(cls, suggestion_id):
        return cls.objects.get(id=suggestion_id)

    @classmethod
    def get_suggestion_for_question(cls, question_id):
        return cls.objects.filter(question=question_id, status=Suggestion.IN_REVIEW).first()


class StudentFeedback(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_feedback')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(null=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
