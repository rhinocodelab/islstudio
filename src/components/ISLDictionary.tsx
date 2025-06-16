import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search } from "lucide-react";

interface DictionaryItem {
  word: string;
  videoPath: string;
}

interface ISLDictionaryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ISLDictionary({ isOpen, onClose }: ISLDictionaryProps) {
  const [dictionary, setDictionary] = useState<DictionaryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchDictionary();
    }
  }, [isOpen]);

  const fetchDictionary = async () => {
    try {
      const response = await fetch('/api/get-isl-dictionary');
      if (!response.ok) throw new Error('Failed to fetch dictionary');
      const data = await response.json();
      setDictionary(data);
    } catch (error) {
      console.error('Error fetching dictionary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDictionary = dictionary.filter(item =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[65vh] p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-lg font-semibold">ISL Dictionary</DialogTitle>
        </DialogHeader>
        <div className="flex h-[calc(65vh-3.5rem)]">
          {/* Left Panel - Dictionary List */}
          <div className="w-1/3 flex flex-col">
            <div className="h-full p-3 pr-0">
              <div className="flex items-center space-x-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search words..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 pr-3">
                {isLoading ? (
                  <div className="text-center py-3">Loading dictionary...</div>
                ) : filteredDictionary.length === 0 ? (
                  <div className="text-center py-3">No words found</div>
                ) : (
                  <div className="space-y-1">
                    {filteredDictionary.map((item) => (
                      <Button
                        key={item.word}
                        variant={selectedVideo === item.videoPath ? "default" : "ghost"}
                        className="w-full justify-start h-8 text-sm"
                        onClick={() => setSelectedVideo(item.videoPath)}
                      >
                        {item.word}
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            <div className="h-full w-[1px] bg-border" />
          </div>

          {/* Right Panel - Video Player */}
          <div className="w-2/3 p-4 flex flex-col">
            {selectedVideo && (
              <div className="mb-3 px-2 text-center">
                <h3 className="text-lg font-semibold text-primary">
                  {dictionary.find(item => item.videoPath === selectedVideo)?.word}
                </h3>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg overflow-hidden">
              {selectedVideo ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <video
                    src={selectedVideo}
                    controls
                    className="w-full h-full object-contain"
                    autoPlay
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 mb-2" />
                  <p className="text-sm">Select a word to view its sign language video</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 