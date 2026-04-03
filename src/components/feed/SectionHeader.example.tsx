import { SectionHeader } from './SectionHeader';

/**
 * Example usage of SectionHeader component
 */
export function SectionHeaderExamples() {
  return (
    <div style={{ padding: 20, background: 'var(--color-bg)' }}>
      {/* Example 1: Label only */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="Your Highlight" />
        <div style={{ height: 100, background: 'var(--color-surf)', borderRadius: 16 }} />
      </div>

      {/* Example 2: Label with link */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          label="Challenges"
          linkText="See All"
          onLinkClick={() => console.log('See All clicked')}
        />
        <div style={{ height: 100, background: 'var(--color-surf)', borderRadius: 16 }} />
      </div>

      {/* Example 3: Another section with link */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          label="Open Matches Near You"
          linkText="View Map"
          onLinkClick={() => console.log('View Map clicked')}
        />
        <div style={{ height: 100, background: 'var(--color-surf)', borderRadius: 16 }} />
      </div>

      {/* Example 4: Weekly digest */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="This Week" />
        <div style={{ height: 100, background: 'var(--color-surf)', borderRadius: 16 }} />
      </div>

      {/* Example 5: Tournaments */}
      <div>
        <SectionHeader
          label="Tournaments Near You"
          linkText="Browse All"
          onLinkClick={() => console.log('Browse All clicked')}
        />
        <div style={{ height: 100, background: 'var(--color-surf)', borderRadius: 16 }} />
      </div>
    </div>
  );
}
