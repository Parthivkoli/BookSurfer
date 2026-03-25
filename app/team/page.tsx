"use client";

import { useEffect, useState } from "react";
import { Github, Linkedin } from "lucide-react";

const teamMembers = [
  {
    name: "Parthiv Koli",
    role: "Main Lead",
    github: "https://github.com/Parthivkoli",
    linkedin: "https://www.linkedin.com/in/parthivkoli/",
    avatar: "https://github.com/Parthivkoli.png",
    bio: "Aspiring Cloud and Data Analyst with a strong foundation in computer science and AI. Passionate about leveraging technology to create innovative solutions.",
    accent: "#6EE7B7",
    tag: "01",
  },
  {
    name: "Prathamesh Gaikwad",
    role: "2nd Lead",
    github: "https://github.com/prathamesh9930",
    linkedin: "https://www.linkedin.com/in/prathamesh-gaikwad-31317a319/",
    avatar: "https://github.com/prathamesh9930.png",
    bio: "Tech enthusiast and problem solver, focusing on full-stack development and backend solutions.",
    accent: "#93C5FD",
    tag: "02",
  },
  {
    name: "Sahil Ganjave",
    role: "Backend Developer",
    github: "https://github.com/sahilganjave05",
    linkedin: "https://www.linkedin.com/in/sahil-ganjave-7b556031b/",
    avatar: "https://github.com/sahilganjave05.png",
    bio: "Backend specialist skilled in database management and API development. Passionate about building scalable systems.",
    accent: "#FCA5A5",
    tag: "03",
  },
  {
    name: "Himanshu Maurya",
    role: "Frontend Developer",
    github: "https://github.com/himanshu-maurya",
    linkedin: "https://www.linkedin.com/in/himanshu-maurya-0630a7231/",
    avatar: "https://github.com/himanshu-maurya.png",
    bio: "Frontend developer with a keen eye for design and user experience. Focused on creating beautiful and functional UIs.",
    accent: "#D8B4FE",
    tag: "04",
  },
];

function Avatar({ src, name, accent }: { src: string; name: string; accent: string }) {
  const [error, setError] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("");

  if (error) {
    return (
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: accent + "22",
          border: `2px solid ${accent}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          color: accent,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        objectFit: "cover",
        border: `2px solid ${accent}44`,
        flexShrink: 0,
        display: "block",
      }}
    />
  );
}

function Card({ member, index }: { member: typeof teamMembers[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#13161f" : "#0d1017",
        border: `1px solid ${hovered ? member.accent + "40" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        cursor: "default",
        transition: "border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${member.accent}20`
          : "0 2px 16px rgba(0,0,0,0.3)",
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
        animationName: "fadeUp",
        animationDuration: "0.5s",
        animationTimingFunction: "ease-out",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar src={member.avatar} name={member.name} accent={member.accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.38)",
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.18em",
              marginBottom: 4,
            }}
          >
            {member.tag}
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {member.name}
          </div>
          <div
            style={{
              color: member.accent,
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {member.role}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${member.accent}33, transparent)`,
        }}
      />

      {/* Bio */}
      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 13,
          lineHeight: 1.65,
          margin: 0,
          flex: 1,
        }}
      >
        {member.bio}
      </p>

      {/* Links */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {[
          { href: member.github, Icon: Github, label: "GitHub" },
          { href: member.linkedin, Icon: Linkedin, label: "LinkedIn" },
        ].map(({ href, Icon, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 8,
              border: `1px solid ${member.accent}30`,
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.04)",
              textDecoration: "none",
              transition: "color 0.2s, background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = member.accent;
              (e.currentTarget as HTMLAnchorElement).style.background = member.accent + "15";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = member.accent + "60";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)";
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = member.accent + "30";
            }}
          >
            <Icon size={15} />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Team() {
  useEffect(() => {
    document.title = "Meet Our Team \u2014 BookSurfer";
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background: "#070a10",
          padding: "80px 16px 60px",
          boxSizing: "border-box",
        }}
      >
        {/* Subtle radial glow — pure CSS, no canvas */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(110,231,183,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle at 100% 100%, rgba(147,197,253,0.05) 0%, transparent 60%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 64,
            }}
          >
            <div
              style={{
                display: "inline-block",
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#6EE7B7",
                opacity: 0.7,
                marginBottom: 20,
              }}
            >
              The people behind the magic
            </div>

            <h1
              style={{
                margin: "0 0 20px",
                fontSize: "clamp(40px, 7vw, 72px)",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              Meet the{" "}
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #6EE7B7, #93C5FD, #D8B4FE, #6EE7B7)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "shimmer 5s linear infinite",
                  display: "inline-block",
                }}
              >
                BookSurfer Team
              </span>
            </h1>

            <p
              style={{
                margin: "0 auto",
                maxWidth: 480,
                fontSize: 15,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.38)",
              }}
            >
              A small, passionate crew building a delightful reading platform
              &mdash; one commit at a time.
            </p>

            {/* Decorative line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginTop: 36,
              }}
            >
              <div
                style={{
                  height: 1,
                  width: 60,
                  background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15))",
                }}
              />
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                }}
              />
              <div
                style={{
                  height: 1,
                  width: 60,
                  background: "linear-gradient(to left, transparent, rgba(255,255,255,0.15))",
                }}
              />
            </div>
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {teamMembers.map((member, i) => (
              <Card key={member.name} member={member} index={i} />
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: 60,
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.15)",
            }}
          >
            BookSurfer &middot; Built with{" "}
            <span style={{ color: "#FCA5A5" }}>&#9825;</span> in India
          </div>
        </div>
      </main>
    </>
  );
}