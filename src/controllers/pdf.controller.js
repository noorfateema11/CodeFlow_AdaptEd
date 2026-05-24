const { PDFParse } = require('pdf-parse');
const Document = require('../models/document.model');
const aiService = require('../services/ai.service');

async function pdfParse(buffer) {
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    await parser.load();
    const result = await parser.getText();
    return { text: result.text, numpages: result.numpages || 1 };
}

exports.uploadPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded. Use field name "pdf".' });

        const userId = req.user.userId;
        const disabilityType = req.user.disabilityType || 'none';

        const parsed = await pdfParse(req.file.buffer);
        const extractedText = parsed.text || '';

        if (!extractedText || extractedText.trim().length === 0)
            return res.status(422).json({ message: 'Could not extract text from this PDF (it may be a scanned image).' });

        const pdfBase64 = disabilityType === 'blind' ? req.file.buffer.toString('base64') : null;
        const aiResult = await aiService.adaptText(extractedText, disabilityType, pdfBase64);

        const newDoc = new Document({
            userId,
            originalName: req.file.originalname,
            extractedText,
            processedContent: { [aiResult.kind]: aiResult.result },
            disabilityTypeAtUpload: disabilityType
        });

        await newDoc.save();

        res.status(201).json({
            message: 'PDF uploaded and processed successfully',
            documentId: newDoc._id,
            disabilityType,
            contentType: aiResult.kind,
            content: aiResult.result,
            audioUrl: aiResult.audioUrl || null,
            // NLP analysis sent to frontend for display
            nlpAnalysis: aiResult.nlpAnalysis || null
        });

    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({ message: 'Error processing PDF', error: error.message });
    }
};

exports.getMyDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ userId: req.user.userId })
            .select('-extractedText').sort({ uploadedAt: -1 });
        res.status(200).json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
};

exports.getDocumentById = async (req, res) => {
    try {
        const doc = await Document.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.status(200).json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching document', error: error.message });
    }
};
