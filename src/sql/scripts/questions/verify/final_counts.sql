SELECT 'questions ' || type_question AS table_name, COUNT(*)
FROM questions
GROUP BY type_question
UNION ALL
SELECT 'questions_ministeres_attributaires', COUNT(*)
FROM questions_ministeres_attributaires;
