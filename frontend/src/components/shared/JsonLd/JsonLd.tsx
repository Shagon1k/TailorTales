const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

interface IJsonLdProps {
    siteName: string;
    description: string;
}

/**
 * Site-wide structured data: Organization (knowledge-panel logo/name) and WebSite.
 * Rendered once in the locale layout. The two nodes share one @graph so Google reads
 * them as a single document. Product/Article schema is not applicable — our stories
 * are private, not catalog items.
 */
export default function JsonLd({
    siteName,
    description,
}: Readonly<IJsonLdProps>): React.ReactElement {
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: siteName,
                url: SITE_URL,
                logo: `${SITE_URL}/apple-icon.png`,
                description,
            },
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                name: siteName,
                url: SITE_URL,
                description,
                publisher: { '@id': `${SITE_URL}/#organization` },
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            // JSON.stringify output is safe to inline; no user input flows into this graph.
            // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
    );
}
