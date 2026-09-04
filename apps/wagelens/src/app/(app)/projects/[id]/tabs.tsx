import Link from 'next/link';

import { projectTabs } from './project-context';

/** UX.md A7's tabs, as links: the project's four surfaces, always visible, so
 *  "where do I add the crew" is never a question. */
export function ProjectTabs({ id, current }: { id: string; current: string }) {
  return (
    <nav className="wl-tabs" aria-label="Project">
      {projectTabs(id).map((tab) => (
        <Link
          className="wl-tab"
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === current ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
