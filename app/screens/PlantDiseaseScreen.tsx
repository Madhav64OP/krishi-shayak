
import React, { useState, useRef, isValidElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Leaf, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, Button } from '../components/ui';
import useProfileStore from '../store/profileStore';
import { getDiseaseAdviceFromGemini } from '../services/geminiService';
import { useTranslation } from '../hooks/useTranslation';
import { DISEASE_API_ENDPOINT } from '../config';

// New Component to render formatted advice from Gemini
const FormattedAdvice: React.FC<{ text: string }> = ({ text }) => {
  // Split by newline and filter out any empty lines that are just whitespace
  const rawElements = text.split('\n').map((line, lineIndex) => {
    if (line.trim() === '') return null; 

    // Handle list items (starting with * or -)
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      // Process for bold text inside list item
      const parts = content.split(/(\*\*.*?\*\*)/g).filter(part => part);
      return (
        <li key={lineIndex} className="ml-4 list-disc">
          {parts.map((part, i) => (
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={i} className="text-text">{part.slice(2, -2)}</strong> 
              : part
          ))}
        </li>
      );
    }

    // Handle regular paragraphs with bolding
    const parts = line.split(/(\*\*.*?\*\*)/g).filter(part => part);
    return (
      <p key={lineIndex} className="mb-2">
        {parts.map((part, i) => (
          part.startsWith('**') && part.endsWith('**') 
            ? <strong key={i} className="text-text">{part.slice(2, -2)}</strong> 
            : part
        ))}
      </p>
    );
  }).filter(Boolean); // Remove nulls from empty lines

  // Group consecutive list items into <ul> tags
  const finalElements: React.ReactNode[] = [];
  let listItems: React.ReactElement[] = [];

  rawElements.forEach((el, index) => {
    if (isValidElement(el) && el.type === 'li') {
      listItems.push(el);
    } else {
      // If we have accumulated list items, wrap them in a <ul> and push to final array
      if (listItems.length > 0) {
        finalElements.push(<ul key={`ul-${index}`} className="space-y-1 mb-2">{listItems}</ul>);
        listItems = []; // Reset the list
      }
      finalElements.push(el);
    }
  });

  // If the text ends with a list, push the final <ul>
  if (listItems.length > 0) {
    finalElements.push(<ul key="ul-last" className="space-y-1 mb-2">{listItems}</ul>);
  }

  return <div className="text-text-secondary whitespace-normal">{finalElements}</div>;
};


const PlantDiseaseScreen: React.FC = () => {
    const navigate = useNavigate();
    const profile = useProfileStore((state) => state.profile);
    const { t } = useTranslation();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [advice, setAdvice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsLoading(false);
        setPrediction(null);
        setAdvice(null);
        setError(null);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            resetState();
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleDiagnose = async () => {
        if (!selectedFile || !profile) {
            setError(t('noImageSelected'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setPrediction(null);
        setAdvice(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Step 1: Get prediction from the disease detection API
            const response = await fetch(DISEASE_API_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(t('predictionError'));
            }
            const data = await response.json();
            const diseasePrediction = data.prediction;
            setPrediction(diseasePrediction);

            // Step 2: Get advice from Gemini
            try {
                const geminiAdvice = await getDiseaseAdviceFromGemini(profile, diseasePrediction);
                setAdvice(geminiAdvice);
            } catch (geminiError) {
                console.error("Gemini Error:", geminiError);
                setError(t('adviceError')); // Set a specific error for Gemini failure
            }
        } catch (e: any) {
            console.error("Diagnosis Error:", e);
            setError(e.message || t('predictionError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 flex flex-col">
            <header className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                    <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-surface-light mr-4">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-2xl font-bold">{t('plantDiseaseTitle')}</h1>
                </div>
                 <button onClick={resetState} className="p-2 rounded-full hover:bg-surface-light disabled:opacity-50">
                    <RefreshCw className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-grow flex flex-col justify-center items-center text-center space-y-6">
                <AnimatePresence mode="wait">
                    {previewUrl && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <h2 className="text-lg font-semibold text-text-secondary mb-2">{t('imagePreview')}</h2>
                            <img src={previewUrl} alt="Plant preview" className="max-h-64 w-auto rounded-3xl shadow-lg border-2 border-surface-light" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {!previewUrl && !prediction && (
                    <Card className="w-full max-w-sm p-8 flex flex-col items-center justify-center border-2 border-dashed border-surface-light bg-surface/50">
                        <Upload className="w-16 h-16 text-primary mb-4" />
                        <p className="text-text-secondary">{t('uploadImagePrompt')}</p>
                    </Card>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                <div className="w-full max-w-sm space-y-4">
                    { !prediction &&
                    <Button onClick={triggerFileSelect} className="w-full bg-surface-light text-text hover:bg-surface">
                        {previewUrl ? t('changeImageButton') : t('selectImageButton')}
                    </Button>
                    }
                    
                    {previewUrl && !prediction && (
                         <Button onClick={handleDiagnose} disabled={isLoading} className="w-full">
                            {isLoading ? t('diagnosing') : t('diagnoseButton')}
                        </Button>
                    )}
                </div>

                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2 text-primary">
                        <Leaf className="animate-spin w-6 h-6" />
                        <span>{t('diagnosing')}</span>
                    </motion.div>
                )}
                
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                             <Card className="w-full max-w-sm text-center bg-error/10 border border-error/50">
                                <AlertTriangle className="mx-auto h-8 w-8 text-error mb-2" />
                                <p className="text-text-secondary">{error}</p>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {(prediction || advice) && !isLoading &&(
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-md text-left space-y-4 pt-4"
                        >
                            {prediction && (
                                <Card>
                                    <h3 className="flex items-center text-xl font-bold text-primary mb-2">
                                        <Leaf className="w-5 h-5 mr-2"/> {t('diseasePrediction')}
                                    </h3>
                                    <p className="text-lg text-text capitalize">{prediction}</p>
                                </Card>
                            )}
                             {advice && (
                                <Card>
                                     <h3 className="flex items-center text-xl font-bold text-accent mb-2">
                                        <Sparkles className="w-5 h-5 mr-2"/> {t('geminiAdvice')}
                                    </h3>
                                    <FormattedAdvice text={advice} />
                                </Card>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PlantDiseaseScreen;
