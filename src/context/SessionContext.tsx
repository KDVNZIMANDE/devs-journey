"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  SetStateAction,
} from "react";
import { useUser } from "@clerk/nextjs";
import { User, Project, Milestone, Comment } from "@/types";
import { getUserProfile } from "@/app/api/user";
import { getProjects } from "@/app/api/projects";

type SessionContextType = {
  userData:          User | null;
  reloadUserData:    () => void;
  isLoadingUser:     boolean;

  projects:          Project[];
  setProjects:       React.Dispatch<SetStateAction<Project[]>>;
  reloadProjects:    () => void;
  isLoadingProjects: boolean;

  milestones:        Record<string, Milestone[]>;
  setMilestones:     React.Dispatch<SetStateAction<Record<string, Milestone[]>>>;

  comments:          Record<string, Comment[]>;
  setComments:       React.Dispatch<SetStateAction<Record<string, Comment[]>>>;
};

const defaultContext: SessionContextType = {
  userData:          null,
  reloadUserData:    () => {},
  isLoadingUser:     true,

  projects:          [],
  setProjects:       () => {},
  reloadProjects:    () => {},
  isLoadingProjects: true,

  milestones:        {},
  setMilestones:     () => {},

  comments:          {},
  setComments:       () => {},
};

export const SessionContext = createContext<SessionContextType>(defaultContext);
export const useSession = () => useContext(SessionContext);

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();

  const [userData, setUserData]           = useState<User | null>(null);
  const [reloadUser, setReloadUser]       = useState(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [projects, setProjects]                           = useState<Project[]>([]);
  const [reloadProjectsTrigger, setReloadProjectsTrigger] = useState(0);
  const [isLoadingProjects, setIsLoadingProjects]         = useState(true);

  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [comments, setComments]     = useState<Record<string, Comment[]>>({});

  // ── User data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUserData(null);
      setIsLoadingUser(false);
      return;
    }

    const fetch = async () => {
      setIsLoadingUser(true);
      try {
        const result = await getUserProfile();
        setUserData(result.success && result.data ? result.data : null);
      } catch {
        setUserData(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetch();
  }, [isLoaded, isSignedIn, reloadUser]);

  // ── Projects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const result = await getProjects({ mine: true });
        if (result.success && result.data) {
          setProjects(result.data.projects);
        }
      } catch {
        // keep previous state
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [isSignedIn, reloadProjectsTrigger]);

  // ── SSE ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSignedIn || !userData?._id) return;

    const es = new EventSource("/api/feed");

    es.addEventListener("new_project", (e) => {
      const project = JSON.parse(e.data) as Project;
      if (String(project.authorId) !== String(userData?.clerkId)) return;
      setProjects((prev) =>
        prev.some((p) => String(p._id) === String(project._id))
          ? prev
          : [{ ...project, commentCount: 0 }, ...prev]
      );
    });

    es.addEventListener("project_updated", (e) => {
      const updated = JSON.parse(e.data) as Project;
      setProjects((prev) =>
        prev.map((p) =>
          String(p._id) === String(updated._id)
            ? { ...p, ...updated, commentCount: p.commentCount ?? 0 }
            : p
        )
      );
    });

    es.addEventListener("project_completed", (e) => {
      const completed = JSON.parse(e.data) as Project;
      setProjects((prev) =>
        prev.filter((p) => String(p._id) !== String(completed._id))
      );
    });

    es.addEventListener("new_milestone", (e) => {
      const { milestone } = JSON.parse(e.data) as { milestone: Milestone };
      const pid = String(milestone.projectId);
      setMilestones((prev) => ({
        ...prev,
        [pid]: [milestone, ...(prev[pid] ?? [])],
      }));
    });

    es.addEventListener("new_comment", (e) => {
      const comment = JSON.parse(e.data) as Comment;
      const pid = String(comment.projectId);

      // Append to comment cache
      setComments((prev) => ({
        ...prev,
        [pid]: [...(prev[pid] ?? []), comment],
      }));

      // Increment commentCount on the matching project card
      setProjects((prev) =>
        prev.map((p) =>
          String(p._id) === pid
            ? { ...p, commentCount: (p.commentCount ?? 0) + 1 }
            : p
        )
      );
    });

    es.onerror = () => console.error("[SSE] Connection error");

    return () => es.close();
  }, [isSignedIn, userData?._id]);

  const reloadUserData = useCallback(() => setReloadUser((n) => n + 1), []);
  const reloadProjects = useCallback(() => setReloadProjectsTrigger((n) => n + 1), []);

  return (
    <SessionContext.Provider
      value={{
        userData, reloadUserData, isLoadingUser,
        projects, setProjects, reloadProjects, isLoadingProjects,
        milestones, setMilestones,
        comments, setComments,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}