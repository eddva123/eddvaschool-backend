// import { query } from '../config/db.js';
// import asyncHandler from '../utils/asyncHandler.js';
// import APIError from '../utils/APIError.js';

// export const getTopics = asyncHandler(async (req, res, next) => {
//     const result = await query(`
//         SELECT t.*, s.name as subject_name 
//         FROM topics t 
//         JOIN subjects s ON t.subject_id = s.id
//     `);
//     res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
// });

// export const createTopic = asyncHandler(async (req, res, next) => {
//     const { name, subject_id } = req.body;
//     const result = await query(
//         'INSERT INTO topics (name, subject_id) VALUES ($1, $2) RETURNING *',
//         [name, subject_id]
//     );
//     res.status(201).json({ success: true, data: result.rows[0] });
// });

// export const getTopicWithChapters = asyncHandler(async (req, res, next) => {
//     const topic = await query('SELECT * FROM topics WHERE id = $1', [req.params.id]);
//     if (topic.rows.length === 0) return next(new APIError('Topic not found', 404));

//     const chapters = await query('SELECT * FROM chapters WHERE topic_id = $1 ORDER BY "order" ASC', [req.params.id]);
//     res.status(200).json({ success: true, data: { ...topic.rows[0], chapters: chapters.rows } });
// });

// export const addChapter = asyncHandler(async (req, res, next) => {
//     const { name, order } = req.body;
//     const result = await query(
//         'INSERT INTO chapters (topic_id, name, "order") VALUES ($1, $2, $3) RETURNING *',
//         [req.params.id, name, order]
//     );
//     res.status(201).json({ success: true, data: result.rows[0] });
// });


import { query } from '../config/db.js';

import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';
import { resolveInstituteId } from '../utils/instituteScope.js';

// =====================================
// GET ALL TOPICS
// =====================================
export const getTopics = asyncHandler(
    async (req, res, next) => {
        const instituteId = await resolveInstituteId(req.user, req.query.instituteId);

        const result = await query(
            `
            SELECT
                t.id,
                t.name,
                t.subject_id,
                t.progress,
                t.status,
                t.created_at,

                s.name AS subject_name,

                COUNT(c.id)::int AS chapters

            FROM topics t

            INNER JOIN subjects s
                ON t.subject_id = s.id AND s.institute_id = $1

            LEFT JOIN chapters c
                ON c.topic_id = t.id

            GROUP BY
                t.id,
                s.name

            ORDER BY t.id DESC
            `,
            [instituteId]
        );

        res.status(200).json({
            success: true,
            message: 'Topics fetched successfully',
            count: result.rows.length,
            data: result.rows,
        });
    }
);

// =====================================
// CREATE TOPIC
// =====================================
export const createTopic = asyncHandler(
    async (req, res, next) => {
        const { name, subject_id } = req.body;
        const instituteId = await resolveInstituteId(req.user, req.body.instituteId);

        // =============================
        // VALIDATION
        // =============================
        if (!name || !subject_id) {
            return next(
                new APIError(
                    'Name and subject_id are required',
                    400
                )
            );
        }

        // =============================
        // CHECK SUBJECT EXISTS
        // =============================
        const subjectExists = await query(
            `
            SELECT id
            FROM subjects
            WHERE id = $1 AND institute_id = $2
            `,
            [subject_id, instituteId]
        );

        if (subjectExists.rows.length === 0) {
            return next(
                new APIError(
                    'Subject not found',
                    404
                )
            );
        }

        // =============================
        // CREATE TOPIC
        // =============================
        const result = await query(
            `
            INSERT INTO topics
            (
                institute_id,
                name,
                subject_id,
                progress,
                status
            )
            VALUES ($1, $2, $3, $4, $5)

            RETURNING *
            `,
            [
                instituteId,
                name.trim(),
                subject_id,
                0,
                'pending',
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Topic created successfully',
            data: result.rows[0],
        });
    }
);

// =====================================
// GET SINGLE TOPIC WITH CHAPTERS
// =====================================
export const getTopicWithChapters =
    asyncHandler(async (req, res, next) => {
        const topicId = req.params.id;
        const instituteId = await resolveInstituteId(req.user, req.query.instituteId);

        // =============================
        // GET TOPIC
        // =============================
        const topic = await query(
            `
            SELECT
                t.*,
                s.name AS subject_name

            FROM topics t

            INNER JOIN subjects s
                ON t.subject_id = s.id AND s.institute_id = $2

            WHERE t.id = $1
            `,
            [topicId, instituteId]
        );

        if (topic.rows.length === 0) {
            return next(
                new APIError(
                    'Topic not found',
                    404
                )
            );
        }

        // =============================
        // GET CHAPTERS
        // =============================
        const chapters = await query(
            `
            SELECT
                id,
                topic_id,
                name,
                "order",
                progress,
                status,
                created_at

            FROM chapters

            WHERE topic_id = $1

            ORDER BY "order" ASC
            `,
            [topicId]
        );

        res.status(200).json({
            success: true,
            message:
                'Topic fetched successfully',
            data: {
                ...topic.rows[0],
                chapters: chapters.rows,
            },
        });
    });

// =====================================
// ADD CHAPTER
// =====================================
export const addChapter = asyncHandler(
    async (req, res, next) => {
        const topicId = req.params.id;
        const instituteId = await resolveInstituteId(req.user, req.body.instituteId);

        const { name, order } = req.body;

        // ==============================
        // VALIDATION
        // ==============================
        if (!name || order === undefined) {
            return next(
                new APIError(
                    'Name and order are required',
                    400
                )
            );
        }

        // ==============================
        // CHECK TOPIC EXISTS
        // ==============================
        const topicExists = await query(
            `
            SELECT t.id
            FROM topics t
            INNER JOIN subjects s ON t.subject_id = s.id AND s.institute_id = $2
            WHERE t.id = $1
            `,
            [topicId, instituteId]
        );

        if (topicExists.rows.length === 0) {
            return next(
                new APIError(
                    'Topic not found',
                    404
                )
            );
        }

        // ==============================
        // CREATE CHAPTER
        // ==============================
        const result = await query(
            `
            INSERT INTO chapters
            (
                topic_id,
                name,
                "order"
            )
            VALUES ($1, $2, $3)

            RETURNING *
            `,
            [
                topicId,
                name.trim(),
                Number(order),
            ]
        );

        // ==============================
        // RECALCULATE TOPIC PROGRESS
        // ==============================
        const topicStats = await query(
            `
            SELECT
                COUNT(*)::int AS total,

                COUNT(*) FILTER (
                    WHERE status = 'completed'
                )::int AS completed

            FROM chapters

            WHERE topic_id = $1
            `,
            [topicId]
        );

        const total =
            topicStats.rows[0].total;

        const completed =
            topicStats.rows[0].completed;

        let progress = 0;

        if (total > 0) {
            progress = Math.round(
                (completed / total) * 100
            );
        }

        let status = 'pending';

        if (
            progress > 0 &&
            progress < 100
        ) {
            status = 'active';
        }

        if (progress === 100) {
            status = 'completed';
        }

        // ==============================
        // UPDATE TOPIC
        // ==============================
        await query(
            `
            UPDATE topics
            SET
                progress = $1,
                status = $2,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $3
            `,
            [
                progress,
                status,
                topicId,
            ]
        );

        // ==============================
        // RESPONSE
        // ==============================
        res.status(201).json({
            success: true,
            message:
                'Chapter created successfully',
            data: result.rows[0],
        });
    }
);