import json
import hashlib
from collections import defaultdict


# ======================================================
# BASIC VALIDATION
# ======================================================

def validate_add_question_request(request):
    """
    Basic validation for add question APIs
    """
    data = request.data

    required_fields = ['course_subject_id', 'description', 'options']
    for field in required_fields:
        if data.get(field) is None:
            raise Exception(f"{field} is mandatory")


# ======================================================
# QUESTION SIGNATURE (TUPLE – HUMAN READABLE)
# ======================================================

def get_question_signature(question):
    """
    Logical identity of a question.
    SAME question = description + options + topic + sub_topic

    Used for:
    - bulk updates
    - duplicate detection
    - availability checks
    """
    return (
        question.description,
        json.dumps(question.options or {}, sort_keys=True),
        question.topic.name if question.topic else None,
        question.sub_topic.name if question.sub_topic else None
    )


# ======================================================
# QUESTION SIGNATURE HASH (FAST + STABLE)
# ======================================================

def get_question_signature_hash_from_parts(
    description,
    options,
    topic_name=None,
    sub_topic_name=None,
):
    """
    Generates a stable hash from question parts.
    Useful for fast comparison and async jobs.
    """
    raw = (
        description or "",
        json.dumps(options or {}, sort_keys=True),
        topic_name or "",
        sub_topic_name or "",
    )
    raw_str = "||".join(map(str, raw))
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()


def get_question_signature_hash(question):
    """
    Hash version of question signature.
    """
    return get_question_signature_hash_from_parts(
        description=question.description,
        options=question.options,
        topic_name=question.topic.name if question.topic else None,
        sub_topic_name=question.sub_topic.name if question.sub_topic else None,
    )


# ======================================================
# ANSWER CHANGE DETECTION (CRITICAL)
# ======================================================

def normalize_list(values):
    if not values:
        return []
    return sorted([str(v).strip().lower() for v in values])


def has_answer_changed(question, validated_data):
    """
    Detect answer change for all question types.
    """

    question_type = question.question_type
    question_subtype = question.question_subtype

    old_options = question.options or []
    new_options = validated_data.get("options")

    if new_options is None:
        return False

    # ------------------------------
    # MCQ Single Choice
    # ------------------------------
    if question_type == "MCQ" and question_subtype == "SINGLE_CHOICE":

        return normalize_list(old_options) != normalize_list(new_options)

    # ------------------------------
    # MCQ Multi Choice
    # ------------------------------
    if question_type == "MCQ" and question_subtype == "MULTI_CHOICE":

        return normalize_list(old_options) != normalize_list(new_options)

    # ------------------------------
    # GRIDIN Single Answer
    # ------------------------------
    if question_type == "GRIDIN" and question_subtype == "SINGLE_ANSWER":

        return normalize_list(old_options) != normalize_list(new_options)

    # ------------------------------
    # GRIDIN Multi Answer
    # ------------------------------
    if question_type == "GRIDIN" and question_subtype == "MULTI_ANSWER":

        return normalize_list(old_options) != normalize_list(new_options)

    # ------------------------------
    # GRIDIN Range Based
    # ------------------------------
    if question_type == "GRIDIN" and question_subtype == "RANGE_BASED_ANSWER":

        return normalize_list(old_options) != normalize_list(new_options)

    # ------------------------------
    # Fill in the Blanks
    # ------------------------------
    if question_subtype == "FILL_IN_THE_BLANKS":

        return normalize_list(old_options) != normalize_list(new_options)

    # ------------------------------
    # Reading Comprehension
    # ------------------------------
    if question_subtype == "READING_COMPREHENSION":

        return normalize_list(old_options) != normalize_list(new_options)

    return False


# ======================================================
# QUESTION AVAILABILITY MAP (USED IN LIST API)
# ======================================================

def build_question_availability_map(questions):
    """
    SAME question = description + options + topic + sub_topic
    Availability is computed ACROSS ALL COURSES (same subject)

    Output example:
    {
        signature: [
            {
                "course": "JEE",
                "subject": "Physics",
                "course_subject_id": 12,
                "is_active": True
            },
            ...
        ]
    }
    """

    signature_map = defaultdict(list)

    for q in questions:
        signature = get_question_signature(q)

        signature_map[signature].append({
            "course": q.course_subject.course.name,
            "subject": q.course_subject.subject.name,
            "course_subject_id": q.course_subject.id,
            "is_active": q.is_active,
        })

    return signature_map


# ======================================================
# SAFE SIGNATURE COMPARISON (HELPER)
# ======================================================

def is_same_question(q1, q2):
    """
    Safely checks whether two Question objects
    represent the same logical question.
    """
    return get_question_signature(q1) == get_question_signature(q2)


# ======================================================
# BULK MATCH HELPER (OPTIMIZED)
# ======================================================

def filter_questions_by_signature(base_question, candidates):
    """
    Returns only questions that match base_question signature.
    Used in bulk update API.
    """
    base_hash = get_question_signature_hash(base_question)

    matched = []
    for q in candidates:
        if get_question_signature_hash(q) == base_hash:
            matched.append(q)

    return matched


def has_options_changed(question, validated_data):
    """
    Detect option/answer change for MCQ and GRIDIN questions.
    """

    new_options = validated_data.get("options")

    if new_options is None:
        return False

    old_options = question.options

    try:
        old_options_clean = sorted([str(o).strip() for o in old_options])
        new_options_clean = sorted([str(o).strip() for o in new_options])
    except Exception:
        return old_options != new_options

    return old_options_clean != new_options_clean