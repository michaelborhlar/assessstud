from docx import Document

def parse_bulk_questions(file):
    doc = Document(file)
    questions = []
    current = {}
    choices_map = {'A': None, 'B': None, 'C': None, 'D': None}

    def save_current(current, choices_map):
        if not current.get('text'):
            return None
        choices = []
        answer = current.get('answer', '').upper().strip()
        for label in ['A', 'B', 'C', 'D']:
            if choices_map.get(label):
                choices.append({
                    'label': label,
                    'text': choices_map[label],
                    'is_correct': label == answer
                })
        current['choices'] = choices
        # for typed questions, store correct answer as text
        if answer and choices_map.get(answer):
            current['correct_text_answer'] = choices_map[answer]
        return current

    for para in doc.paragraphs:
        text = para.text.strip()

        if not text:
            # blank line = end of question
            if current.get('text'):
                saved = save_current(current, choices_map)
                if saved:
                    questions.append(saved)
            current = {}
            choices_map = {'A': None, 'B': None, 'C': None, 'D': None}
            continue

        upper = text.upper()

        if upper.startswith('Q:'):
            current['text'] = text[2:].strip()
        elif upper.startswith('A:'):
            choices_map['A'] = text[2:].strip()
        elif upper.startswith('B:'):
            choices_map['B'] = text[2:].strip()
        elif upper.startswith('C:'):
            choices_map['C'] = text[2:].strip()
        elif upper.startswith('D:'):
            choices_map['D'] = text[2:].strip()
        elif upper.startswith('ANSWER:'):
            current['answer'] = text[7:].strip()
        elif upper.startswith('TOPIC:'):
            current['topic'] = text[6:].strip()
        elif upper.startswith('SUBJECT:'):
            current['subject'] = text[8:].strip().lower()
        elif upper.startswith('SOLUTION:'):
            current['solution'] = text[9:].strip()

    # save last question if file doesn't end with blank line
    if current.get('text'):
        saved = save_current(current, choices_map)
        if saved:
            questions.append(saved)

    return questions
