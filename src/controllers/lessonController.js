const Lesson = require('../models/lesson.model');

exports.createLesson = async (req, res) => {
    try {
        const { title, category, standardContent, accessibilityContent } = req.body;

        const newLesson = new Lesson({
            title,
            category,
            standardContent,
            accessibilityContent
        });

        await newLesson.save();

        res.status(201).json({
            message: "Lesson created successfully",
            lesson: newLesson
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating lesson",
            error: error.message
        });
    }
};

exports.getAllLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find();

        const disability = req.user ? req.user.disabilityType : 'none';

        const tailoredLessons = lessons.map((lesson) => {
            let optimizedContent = lesson.standardContent;

            if (disability === 'dyslexia') {
                optimizedContent =
                    lesson.accessibilityContent?.dyslexiaFriendlyText ||
                    lesson.standardContent;
            }

            // FIX: was 'cognitive-learning' — enum only has 'visual-learning'
            if (disability === 'visual-learning') {
                optimizedContent =
                    lesson.accessibilityContent?.simplifiedText ||
                    lesson.standardContent;
            }

            return {
                _id: lesson._id,
                title: lesson.title,
                category: lesson.category,
                content: optimizedContent,
                mediaAssets: {
                    audio:
                        disability === 'blind'
                            ? lesson.accessibilityContent?.audioUrl
                            : null,

                    signLanguageVideo:
                        disability === 'deaf'
                            ? lesson.accessibilityContent?.videoSignLanguageUrl
                            : null
                }
            };
        });

        res.status(200).json(tailoredLessons);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching lessons",
            error: error.message
        });
    }
};
