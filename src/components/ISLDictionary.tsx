import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Play, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ISLDictionaryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ISLDictionary({ isOpen, onClose }: ISLDictionaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    // Fetch the list of words from the isl_dataset directory
    const fetchWords = async () => {
      try {
        const response = await fetch('/api/get-isl-words');
        if (response.ok) {
          const data = await response.json();
          setWords(data.words);
        }
      } catch (error) {
        console.error('Error fetching ISL words:', error);
      }
    };

    if (isOpen) {
      fetchWords();
    }
  }, [isOpen]);

  const filteredWords = words.filter(word =>
    word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayVideo = (word: string) => {
    setSelectedWord(word);
    setIsVideoModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl h-[70vh] p-0 overflow-hidden">
          <DialogHeader className="px-3 py-2 border-b">
            <DialogTitle className="text-base font-semibold">ISL Dictionary</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[calc(70vh-2.5rem)]">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <Input
                  type="text"
                  placeholder="Search ISL words..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[85%] py-2 text-sm">ISL Word</TableHead>
                    <TableHead className="w-[15%] py-2 text-sm text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWords.map((word) => (
                    <TableRow key={word} className="hover:bg-muted/50">
                      <TableCell className="py-1.5 text-sm">{word}</TableCell>
                      <TableCell className="py-1.5 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayVideo(word)}
                          className="h-7 w-7 hover:bg-primary/10"
                        >
                          <Play className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-xl" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="flex flex-row items-center justify-between py-2">
            <DialogTitle className="text-base font-semibold">
              {selectedWord}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            {selectedWord && (
              <video
                src={`/isl_dataset/${selectedWord}/${selectedWord}.mp4`}
                controls
                className="w-full h-full object-contain"
                autoPlay
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 