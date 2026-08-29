"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronsRight,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  LayoutGrid,
  Menu,
  PanelLeftClose,
  School,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { Logo } from "./Logo";

const navItems = [
  { label: "Home", href: "/", icon: LayoutGrid },
  { label: "Exams", href: "/", icon: ScrollText },
  { label: "My Classroom", href: "/groups", icon: Users },
  { label: "Create Paper", href: "/assignments/new", icon: FileText },
  { label: "My Library", href: "/library", icon: Clock },
  { label: "AI Toolkit", href: "/toolkit", icon: BookOpen }
];

type NotificationItem = {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "sparkle";
};

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  crumb?: string;
  active?: "home" | "classroom" | "assignments" | "exams" | "library" | "toolkit" | "groups";
  backHref?: string;
  onOpenStudio?: () => void;
};

export function AppShell({
  children,
  title,
  subtitle,
  crumb = "Home",
  active = "home",
  backHref,
  onOpenStudio
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isHovered, setIsHovered] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAiToolsModal, setShowAiToolsModal] = useState(false);

  const isExpanded = isHovered;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Close menus on outside click
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main className={`app-shell ${!isExpanded ? "sidebar-collapsed" : ""}`}>
      {/* ============================================================ */}
      {/* SIDEBAR NAVIGATION (Dropped/Collapsed by default, opens on hover) */}
      {/* ============================================================ */}
      <aside
        className={`sidebar is-collapsed ${isExpanded ? "is-hover-expanded" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="sidebar-header-row">
          {isExpanded ? (
            <Logo />
          ) : (
            <div className="expand-toggle-btn" title="Hover to expand sidebar">
              <div className="veda-mini-logo">V</div>
            </div>
          )}
        </div>

        {/* AI Teacher's Toolkit Pill Button */}
        <Link
          className={`ai-toolkit-btn ${!isExpanded ? "mini" : ""}`}
          href="/toolkit"
          title="AI Teacher's Toolkit"
        >
          <Sparkles size={16} className="toolkit-sparkle" />
          {isExpanded && <span>AI Teacher&apos;s Toolkit</span>}
        </Link>

        {/* Navigation links */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.href === "/" && pathname === "/" && (active === "home" || (item.label === "Exams" && active === "exams"))) ||
              (item.href !== "/" && pathname === item.href);

            return (
              <Link
                key={item.label}
                className={`nav-link ${isActive ? "active" : ""}`}
                href={item.href}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon size={19} />
                {isExpanded && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* School Footer Card */}
        <div className="sidebar-bottom">
          {isExpanded ? (
            <div className="school-card">
              <div className="avatar school-avatar">
                <School size={18} />
              </div>
              <div className="school-info">
                <strong>Delhi Public School</strong>
                <span>Bokaro Steel City</span>
              </div>
            </div>
          ) : (
            <div className="collapsed-footer">
              <div className="avatar school-avatar mini">D</div>
              <div className="expand-bottom-btn" title="Hover to expand">
                <ChevronsRight size={16} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN VIEWPORT & TOPBAR                                       */}
      {/* ============================================================ */}
      <section className="main-panel">
        <header className="topbar desktop-topbar">
          <button
            className="icon-button"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="breadcrumb">
            {crumb === "Exams" ? <ScrollText size={17} /> : <LayoutGrid size={17} />}
            <span>{crumb}</span>
          </div>

          <div className="topbar-spacer" />

          {/* Right Header Actions with Popovers */}
          <div className="topbar-actions-right">
            {/* Help / Guide Button */}
            <button
              className="header-icon-btn"
              onClick={() => setShowHelpModal(true)}
              aria-label="Help & Guide"
              title="Help & Guide"
            >
              <HelpCircle size={19} />
            </button>

            {/* Notification Bell Button */}
            <div className="relative-container" ref={notifRef}>
              <button
                className={`header-icon-btn ${unreadCount > 0 ? "bell-with-dot" : ""}`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && <span className="orange-dot" />}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="dropdown-popover notifications-popover">
                  <div className="popover-header">
                    <div>
                      <strong>Notifications</strong>
                      <span className="popover-badge">{unreadCount} new</span>
                    </div>
                    <div className="popover-actions">
                      <button className="text-action-btn" onClick={markAllAsRead}>
                        Mark all read
                      </button>
                      <button className="text-action-btn" onClick={clearAllNotifications}>
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="popover-body">
                    {notifications.length === 0 ? (
                      <div className="empty-popover-state">
                        <CheckCircle2 size={24} className="muted-icon" />
                        <p>No notifications right now</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.read ? "unread" : ""}`}
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                            );
                          }}
                        >
                          <div className={`notif-icon-box ${n.type}`}>
                            {n.type === "success" && <FileCheck size={14} />}
                            {n.type === "sparkle" && <Sparkles size={14} />}
                            {n.type === "info" && <Users size={14} />}
                          </div>
                          <div className="notif-content">
                            <div className="notif-title-row">
                              <span className="notif-title">{n.title}</span>
                              <span className="notif-time">{n.time}</span>
                            </div>
                            <p className="notif-desc">{n.desc}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Tools Quick Trigger */}
            <button
              className="header-icon-btn"
              onClick={() => setShowAiToolsModal(true)}
              aria-label="AI Tools & Generators"
              title="AI Tools & Generators"
            >
              <Sparkles size={19} />
            </button>

            {/* User Profile Pill Menu */}
            <div className="relative-container" ref={userRef}>
              <div
                className="user-pill-figma clickable"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="Account menu"
              >
                <div className="avatar madhur-avatar">
                  <span>M</span>
                </div>
                <strong className="user-name">Madhur Rastogi</strong>
                <ChevronDown size={15} />
              </div>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="dropdown-popover user-menu-popover">
                  <div className="user-menu-header">
                    <div className="avatar madhur-avatar large">M</div>
                    <div>
                      <strong>Madhur Rastogi</strong>
                      <span>Senior Teacher • Physics</span>
                      <small>madhur.rastogi@dps.edu.in</small>
                    </div>
                  </div>

                  <div className="user-menu-list">
                    <Link
                      href="/groups"
                      className="user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Users size={16} />
                      <span>Classroom & Roster (DPS Bokaro)</span>
                    </Link>
                    <Link
                      href="/toolkit"
                      className="user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Sparkles size={16} />
                      <span>AI Teacher&apos;s Toolkit</span>
                    </Link>
                    <Link
                      href="/library"
                      className="user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Clock size={16} />
                      <span>Exam Question Bank</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings size={16} />
                      <span>Settings & API Keys</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="mobile-header">
          <Logo />
          <div className="mobile-actions">
            <button
              className="bell-button"
              onClick={() => setShowNotifications(true)}
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && <span className="orange-dot" />}
            </button>
            <div
              className="avatar small"
              onClick={() => setShowUserMenu(true)}
            >
              M
            </div>
            <Menu size={23} onClick={() => setIsHovered(!isHovered)} />
          </div>
        </header>

        {(title || subtitle) && (
          <div className="page-title">
            <span className="status-dot" />
            <div>
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
        )}

        {children}
      </section>

      {/* ============================================================ */}
      {/* INTERACTIVE HELP & QUICK GUIDE MODAL                         */}
      {/* ============================================================ */}
      {showHelpModal && (
        <div className="summary-modal-backdrop" onClick={() => setShowHelpModal(false)}>
          <div className="summary-modal-card help-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>AI Assessment Extraction & Mapping Guide</h2>
                <p>Learn how to upload, map, and grade handwritten student papers.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowHelpModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="help-steps-grid">
              <div className="help-step-box">
                <span className="step-badge">1</span>
                <strong>Dual File Upload</strong>
                <p>Upload the Question Paper and one Student Handwritten Answer Sheet (PDF or images up to 10MB).</p>
              </div>
              <div className="help-step-box">
                <span className="step-badge">2</span>
                <strong>Sub-Parts & Order Preservation</strong>
                <p>Questions are extracted in printed order. Labelled sub-parts like <code>11 (a)</code> and <code>11 (b)</code> are treated as separate entries.</p>
              </div>
              <div className="help-step-box">
                <span className="step-badge">3</span>
                <strong>Visual Bounding-Box Highlighter</strong>
                <p>Click any question to highlight its exact answer region on the answer sheet with green bounding boxes.</p>
              </div>
              <div className="help-step-box">
                <span className="step-badge">4</span>
                <strong>Multi-Page & Out-of-Order Support</strong>
                <p>Answers spanning multiple pages (e.g. 11 (b)) and out-of-sequence answers are automatically mapped.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="primary-pill-compact" onClick={() => setShowHelpModal(false)}>
                Got it, let&apos;s start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* AI TEACHER TOOLS QUICK LAUNCHER MODAL                        */}
      {/* ============================================================ */}
      {showAiToolsModal && (
        <div className="summary-modal-backdrop" onClick={() => setShowAiToolsModal(false)}>
          <div className="summary-modal-card ai-tools-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>✨ AI Teacher&apos;s Intelligence Suite</h2>
                <p>Select an AI accelerator to streamline assessment creation and grading.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAiToolsModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="ai-tools-grid">
              <div
                className="ai-tool-card"
                onClick={() => {
                  setShowAiToolsModal(false);
                  router.push("/#studio");
                }}
              >
                <div className="tool-icon-box orange">
                  <ScrollText size={20} />
                </div>
                <div className="tool-info">
                  <strong>Assessment Extraction Studio</strong>
                  <p>Extract questions, transcribe student handwriting, and map answer coordinates.</p>
                </div>
              </div>

              <div
                className="ai-tool-card"
                onClick={() => {
                  setShowAiToolsModal(false);
                  router.push("/assignments/new");
                }}
              >
                <div className="tool-icon-box blue">
                  <FileText size={20} />
                </div>
                <div className="tool-info">
                  <strong>CBSE / ICSE Paper Generator</strong>
                  <p>Generate structured question papers with difficulty breakdown and answer keys.</p>
                </div>
              </div>

              <div
                className="ai-tool-card"
                onClick={() => {
                  setShowAiToolsModal(false);
                  router.push("/toolkit");
                }}
              >
                <div className="tool-icon-box purple">
                  <Sparkles size={20} />
                </div>
                <div className="tool-info">
                  <strong>Automated Marking Rubric Builder</strong>
                  <p>Create step-by-step point allocation rubrics for subjective questions.</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-pill-compact" onClick={() => setShowAiToolsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
