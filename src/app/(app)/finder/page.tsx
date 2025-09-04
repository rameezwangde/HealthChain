'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Sparkles, UserCheck, Loader2, Bot } from 'lucide-react';
import { doctors, medicines, type Medicine } from '@/lib/data';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  findSpecialist,
  type FindSpecialistOutput,
} from '@/ai/flows/find-specialist';
import {
  answerMedicineQuestion,
  type AnswerMedicineQuestionOutput,
} from '@/ai/flows/answer-medicine-question';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FindSpecialistOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFindSpecialist = async () => {
    if (!symptoms) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await findSpecialist({ symptoms });
      setResult(res);
    } catch (e) {
      console.error(e);
      setError('Could not get recommendation. The AI model may be busy.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-primary-foreground/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          Don't know where to start?
        </CardTitle>
        <CardDescription>
          Describe your symptoms, and our AI will suggest a specialist for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="e.g., 'I have a sharp pain in my knee when I walk, and it's been swollen for a week...'"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={3}
          disabled={isLoading}
        />
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <Button onClick={handleFindSpecialist} disabled={isLoading || !symptoms}>
          {isLoading ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <UserCheck className="mr-2" />
          )}
          Suggest a Specialist
        </Button>
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {result && (
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              Recommendation: <Badge>{result.specialist}</Badge>
            </AlertTitle>
            <AlertDescription className="pt-1">
              {result.reasoning}
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}

function MedicineInquiry({ medicine }: { medicine: Medicine }) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnswerMedicineQuestionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAskQuestion = async () => {
    if (!question) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await answerMedicineQuestion({
        medicineName: medicine.name,
        question,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
      setError('Could not get an answer. The AI model may be busy.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground">{medicine.description}</p>
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">Have a question about {medicine.name}?</h4>
            <Textarea
            placeholder="e.g., 'What are the common side effects?'"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            disabled={isLoading}
            />
        </div>
        <Button onClick={handleAskQuestion} disabled={isLoading || !question} size="sm">
            {isLoading ? (
                <Loader2 className="mr-2 animate-spin" />
            ) : (
                <Bot className="mr-2" />
            )}
            Ask AI Assistant
        </Button>
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {result && (
          <Alert variant="default" className="bg-blue-50 border-blue-200">
             <Bot className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">
              AI Assistant Answer
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              {result.answer}
            </AlertDescription>
          </Alert>
        )}
    </div>
  )
}

export default function FinderPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Tabs defaultValue="doctors" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="doctors">Find a Doctor</TabsTrigger>
        <TabsTrigger value="medicines">Find Medicine</TabsTrigger>
      </TabsList>
      <TabsContent value="doctors">
        <Card>
          <CardHeader>
            <CardTitle>Find a Doctor</CardTitle>
            <CardDescription>
              Locate doctors, check for patient crowd levels, or get an AI
              recommendation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
             <div className="space-y-4">
               <SymptomChecker />
              {doctors.map((doctor) => (
                <Card key={doctor.id}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <Image
                        src={doctor.avatar}
                        alt={doctor.name}
                        width={64}
                        height={64}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{doctor.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doctor.specialty}
                      </p>
                      <div className="flex items-center pt-1">
                        <MapPin className="mr-2 h-4 w-4 opacity-70" />
                        <span className="text-xs text-muted-foreground">
                          {doctor.location}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        doctor.availability === 'Low'
                          ? 'default'
                          : doctor.availability === 'Medium'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        doctor.availability === 'Low'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : doctor.availability === 'Medium'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : ''
                      }
                    >
                      {doctor.availability} Crowd
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted md:aspect-auto md:h-full">
              <Image
                src="https://picsum.photos/800/1200?grayscale"
                alt="Map"
                fill
                objectFit="cover"
                data-ai-hint="map"
              />
              <div className="absolute inset-0 bg-primary/20"></div>
              <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground font-bold bg-black/50 p-4 rounded-md">
                Map View (Prototype)
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="medicines">
        <Card>
          <CardHeader>
            <CardTitle>Find & Understand Your Medicine</CardTitle>
            <CardDescription>
              Search for medicines and ask our AI assistant questions.
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for medicines..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredMedicines.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {filteredMedicines.map((medicine) => (
                        <AccordionItem value={medicine.id} key={medicine.id}>
                            <AccordionTrigger className="text-base font-semibold">{medicine.name}</AccordionTrigger>
                            <AccordionContent>
                                <MedicineInquiry medicine={medicine} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>No medicines found for "{searchTerm}".</p>
                </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
