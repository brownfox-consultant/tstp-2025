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


def _normalise_answer(value):
    """
    Normalize an answer value without comparing question/option wording.
    """
    if isinstance(value, str):
        return value.strip().casefold()

    if isinstance(value, (list, tuple)):
        return [_normalise_answer(item) for item in value]

    if isinstance(value, dict):
        return {
            str(key): _normalise_answer(val)
            for key, val in sorted(
                value.items(),
                key=lambda item: str(item[0]),
            )
        }

    return value


def _get_correct_option_signature(options):
    """
    Return only the correct-option selection, excluding option text.
    """
    if isinstance(options, str):
        try:
            options = json.loads(options)
        except (json.JSONDecodeError, TypeError):
            return None

    if not isinstance(options, list):
        return None

    correct = []

    for index, option in enumerate(options):
        if not isinstance(option, dict):
            continue

        is_correct = any(
            option.get(key) is True
            for key in (
                "is_correct",
                "correct",
                "is_answer",
                "isCorrect",
                "isAnswer",
            )
        )

        if is_correct:
            identifier = (
                option.get("id")
                or option.get("key")
                or option.get("label")
                or index
            )
            correct.append(str(identifier))

    return sorted(correct)


def has_answer_changed(question, validated_data):
    """
    Return True only when the answer key changes.

    MCQ:
        Compare correct-option selections, not option wording.

    GRIDIN:
        Compare answer values, not unrelated question text.

    Other question types:
        Return False until their answer-key structure is explicitly
        supported here.
    """
    question_type = str(question.question_type or "").upper()
    question_subtype = str(question.question_subtype or "").upper()

    old_options = question.options or []
    new_options = validated_data.get("options", old_options)

    # ---------------------------------------------
    # MCQ: single-choice and multiple-choice
    # ---------------------------------------------
    if question_type == "MCQ":
        old_signature = _get_correct_option_signature(old_options)
        new_signature = _get_correct_option_signature(new_options)

        # Do not guess if the option structure is unsupported.
        if old_signature is None or new_signature is None:
            return False

        return old_signature != new_signature

    # ---------------------------------------------
    # GRIDIN: compare recognized answer fields
    # ---------------------------------------------
    if question_type == "GRIDIN":
        answer_fields = (
            "answer",
            "correct_answer",
            "correct_answers",
            "answer_key",
            "answer_keys",
            "grid_in_answer",
            "gridin_answer",
            "grid_answer",
            "accepted_answers",
        )

        for field_name in answer_fields:
            old_value = getattr(question, field_name, None)

            if field_name in validated_data:
                new_value = validated_data[field_name]
            else:
                new_value = old_value

            if _normalise_answer(old_value) != _normalise_answer(new_value):
                return True

        # If Grid-in answers are stored inside options, inspect the
        # answer-specific keys and exclude descriptions/text.
        answer_keys = (
            "answer",
            "correct_answer",
            "correct_answers",
            "answer_key",
            "accepted_answers",
            "min_value",
            "max_value",
            "tolerance",
        )

        def extract_grid_answers(options):
            if isinstance(options, str):
                try:
                    options = json.loads(options)
                except (json.JSONDecodeError, TypeError):
                    return None

            if isinstance(options, dict):
                return {
                    key: _normalise_answer(options[key])
                    for key in answer_keys
                    if key in options
                }

            if isinstance(options, list):
                result = []

                for option in options:
                    if not isinstance(option, dict):
                        continue

                    result.append({
                        key: _normalise_answer(option[key])
                        for key in answer_keys
                        if key in option
                    })

                return result

            return None

        old_grid_signature = extract_grid_answers(old_options)
        new_grid_signature = extract_grid_answers(new_options)

        if (
            old_grid_signature is not None
            and new_grid_signature is not None
        ):
            return old_grid_signature != new_grid_signature

        return False

    # Unsupported types do not trigger answer-correction emails.
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