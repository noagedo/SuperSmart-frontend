import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import itemService from '../services/item-service';

interface ReceiptAnalyzerProps {
    onAddToCart?: (items: { _id: string; quantity: number }[]) => void;
}

const ReceiptAnalyzer: React.FC<ReceiptAnalyzerProps> = ({ onAddToCart }) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | { cartItems: { _id: string; quantity: number }[] } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedImage(event.target.files[0]);
            setAnalysisResult(null);
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) {
            setError('Please select an image.');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysisResult(null);

        const formData = new FormData();
        formData.append('receiptImage', selectedImage);

        try {
            const { request } = itemService.analyzeReceipt(formData);
            const response = await request;

            console.log("Full response from analyzeReceipt:", response); // Debugging: Inspect the entire response

            if (response.data?.cartItems) {
                const cartItems = response.data.cartItems;
                console.log("Items from ReceiptAnalyzer:", cartItems);
                setAnalysisResult({ cartItems });
                if (onAddToCart) {
                    onAddToCart(cartItems);
                }
            }
            else if (response.data?.message) {
                setAnalysisResult(response.data.message);
            }
            else {
                setAnalysisResult('Could not process the receipt.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to analyze receipt.');
            console.error('Error analyzing receipt:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 4, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
                ניתוח קבלות באמצעות AI
            </Typography>
            <input
                accept="image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleImageChange}
            />
            <label htmlFor="raised-button-file">
                <Button variant="contained" color="primary" component="span">
                    העלה תמונה
                </Button>
            </label>
            {selectedImage && (
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {`תמונה נבחרה: ${selectedImage.name}`}
                </Typography>
            )}

            <Button
                variant="contained"
                color="secondary"
                onClick={handleSubmit}
                disabled={!selectedImage || loading}
                sx={{ mt: 2 }}
            >
                {loading ? 'אנא המתן...' : 'נתח קבלה'}
            </Button>

            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}

            {analysisResult && typeof analysisResult === 'string' && (
                <Box sx={{ mt: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1">תוצאת ניתוח:</Typography>
                    <Typography>{analysisResult}</Typography>
                </Box>
            )}

            {analysisResult && typeof analysisResult === 'object' && analysisResult.cartItems && analysisResult.cartItems.length > 0 && (
                <Box sx={{ mt: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1">מוצרים שזוהו והועברו לעגלה:</Typography>
                    <ul>
                        {analysisResult.cartItems.map(item => (
                            <li key={item._id}>
                                מזהה מוצר: {item._id}, כמות: {item.quantity}
                            </li>
                        ))}
                    </ul>
                </Box>
            )}
        </Box>
    );
};

export default ReceiptAnalyzer;
