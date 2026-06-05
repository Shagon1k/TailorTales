import Image from 'next/image';
import clsx from 'clsx';
import styles from './MascotImage.module.scss';

export type TMascotImageName =
    | 'fox-books'
    | 'fox-bookshelf'
    | 'fox-hero'
    | 'fox-logo'
    | 'fox-mail'
    | 'fox-map'
    | 'fox-question'
    | 'fox-read'
    | 'fox-ruler'
    | 'fox-scales'
    | 'fox-speak'
    | 'fox-star'
    | 'fox-write';

interface IMascotImageProps {
    image: TMascotImageName;
    size: number;
    glow?: 'aura' | 'outline';
    flip?: boolean;
}

export default function MascotImage({
    image,
    size,
    glow,
    flip = false,
}: Readonly<IMascotImageProps>): React.ReactElement {
    return (
        <div
            className={clsx(
                styles['mascot-image'],
                glow && styles[`m-${glow}`],
                flip && styles['m-flip-x'],
            )}
            style={{ width: size, height: size }}
        >
            <Image
                src={`/images/mascot/${image}.webp`}
                alt=""
                width={size}
                height={size}
                priority
                unoptimized
                className={styles['mascot-image__img']}
            />
        </div>
    );
}
