import Head from "next/head";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Linkedin } from "lucide-react";

const teamMembers = [
  {
    name: "Parthiv Koli",
    role: "Main Lead",
    github: "https://github.com/Parthivkoli",
    linkedin: "https://www.linkedin.com/in/parthivkoli/",
    avatar: "https://github.com/Parthivkoli.png",
    bio: "Aspiring Cloud and Data Analyst with a strong foundation in computer science and AI. Passionate about leveraging technology to create innovative solutions.",
  },
  {
    name: "Prathamesh Gaikwad",
    role: "2nd Lead",
    github: "https://github.com/prathamesh9930",
    linkedin: "https://www.linkedin.com/in/prathamesh-gaikwad-31317a319/",
    avatar: "https://github.com/prathamesh9930.png",
    bio: "Tech enthusiast and problem solver, focusing on full-stack development and backend solutions.",
  },
  {
    name: "Sahil Ganjave",
    role: "Backend Developer",
    github: "https://github.com/sahilganjave05",
    linkedin: "https://www.linkedin.com/in/sahil-ganjave-7b556031b/",
    avatar: "https://github.com/sahilganjave05.png",
    bio: "Backend specialist skilled in database management and API development. Passionate about building scalable systems.",
  },
  {
    name: "Himanshu Maurya",
    role: "Frontend Developer",
    github: "https://github.com/himanshu-maurya",
    linkedin: "https://www.linkedin.com/in/himanshu-maurya-0630a7231/",
    avatar: "https://github.com/himanshu-maurya.png",
    bio: "Frontend developer with a keen eye for design and user experience. Focused on creating beautiful and functional UIs.",
  },
];

export default function Team() {
  return (
    <>
      <Head>
        <title>Meet Our Team - BookSurfer</title>
        <meta name="description" content="Discover the talented developers behind BookSurfer, dedicated to enhancing your reading experience." />
        <meta name="keywords" content="BookSurfer, team, developers, reading app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">Meet Our Team</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We’re a passionate group of developers working together to make BookSurfer a delightful and innovative reading platform.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="group bg-white dark:bg-gray-800 border-none shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <CardHeader className="flex flex-col items-center pb-0">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-gray-200 dark:ring-gray-700 transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{member.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
              </CardHeader>
              <CardContent className="text-center pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{member.bio}</p>
              </CardContent>
              <CardFooter className="flex justify-center space-x-4 pt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s GitHub`}>
                    <Github className="w-5 h-5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s LinkedIn`}>
                    <Linkedin className="w-5 h-5" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}