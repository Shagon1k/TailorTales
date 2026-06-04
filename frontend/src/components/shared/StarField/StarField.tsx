import styles from './StarField.module.scss';

// Xorshift32 PRNG — fixed seed keeps server/client output identical (no hydration mismatch).
function makeRng(seed: number) {
    let s = seed;
    return () => {
        s ^= s << 13; // three XOR-shifts produce a well-distributed sequence
        s ^= s >> 17;
        s ^= s << 5;
        return (s >>> 0) / 0xffffffff; // normalise uint32 → [0, 1)
    };
}

function generateStars(count: number) {
    const rand = makeRng(0xdeadbeef); // arbitrary non-zero seed
    return Array.from({ length: count }, () => ({
        top: `${(rand() * 96 + 2).toFixed(2)}%`, // 2–98% to avoid clipping at edges
        left: `${(rand() * 96 + 2).toFixed(2)}%`,
        size: Math.round(rand() * 14 + 10), // 10–24px
        opacity: +(rand() * 0.45 + 0.25).toFixed(2), // 0.25–0.70
        duration: +(rand() * 3 + 2.5).toFixed(1), // twinkle period 2.5–5.5s
        delay: +(rand() * 4).toFixed(1), // stagger so stars don't pulse in sync
    }));
}

const STARS = generateStars(28);

export default function StarField(): React.ReactElement {
    return (
        <div aria-hidden="true" className={styles['star-field']}>
            {STARS.map(({ top, left, size, opacity, duration, delay }, i) => (
                <svg
                    key={i}
                    className={styles['star-field__star']}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    style={
                        {
                            top,
                            left,
                            width: size,
                            height: size,
                            '--star-opacity': opacity,
                            animationDuration: `${duration}s`,
                            animationDelay: `${delay}s`,
                        } as React.CSSProperties
                    }
                >
                    <path d="M12 0Q12 12 24 12Q12 12 12 24Q12 12 0 12Q12 12 12 0Z" />
                </svg>
            ))}
        </div>
    );
}
