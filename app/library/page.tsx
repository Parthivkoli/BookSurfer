"use client";

import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LibraryPage() {
  const [progress, setProgress] = useState({
    book1: 35,
    book2: 68,
    book3: 12,
    book4: 89,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <div className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>
        
        {/* Reading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48h 23m</div>
              <p className="text-xs text-muted-foreground">+5h from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2 <span className="text-sm">★</span></div>
              <p className="text-xs text-muted-foreground">Based on 12 books</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Library Tabs */}
        <Tabs defaultValue="current" className="mb-8">
          <TabsList>
            <TabsTrigger value="current">Currently Reading</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(progress).map(([book, value], index) => (
                <Card key={book}>
                  <div className="flex">
                    <div className="w-1/3">
                      <img 
                        src={`https://source.unsplash.com/random/300x450?book&sig=${index}`} 
                        alt="Book cover" 
                        className="object-cover w-full h-full rounded-l-lg"
                      />
                    </div>
                    <div className="w-2/3 p-4">
                      <CardTitle className="text-lg mb-1">Book Title {index + 1}</CardTitle>
                      <CardDescription className="mb-3">Author Name</CardDescription>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                        
                        <div className="flex space-x-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>3h 45m</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            <span>4.5</span>
                          </div>
                        </div>
                        
                        <Button size="sm" asChild>
                          <Link href={`/reader/${index}`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Continue Reading
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <div className="flex">
                    <div className="w-1/3">
                      <img 
                        src={`https://source.unsplash.com/random/300x450?book&sig=${index + 10}`} 
                        alt="Book cover" 
                        className="object-cover w-full h-full rounded-l-lg"
                      />
                    </div>
                    <div className="w-2/3 p-4">
                      <CardTitle className="text-lg mb-1">Completed Book {index + 1}</CardTitle>
                      <CardDescription className="mb-3">Author Name</CardDescription>
                      
                      <div className="space-y-4">
                        <div className="flex space-x-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>5h 20m</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            <span>4.{index % 5 + 1}</span>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/reader/${index + 10}`}>
                            Read Again
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="wishlist" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index}>
                  <div className="aspect-[2/3] relative">
                    <img 
                      src={`https://source.unsplash.com/random/300x450?book&sig=${index + 20}`} 
                      alt="Book cover" 
                      className="object-cover w-full h-full rounded-t-lg"
                    />
                  </div>
                  <CardContent className="p-4">
                    <CardTitle className="text-base mb-1">Wishlist Book {index + 1}</CardTitle>
                    <CardDescription className="mb-3">Author Name</CardDescription>
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/reader/${index + 20}`}>
                        Start Reading
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}