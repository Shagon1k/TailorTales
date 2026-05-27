import { Rating as MantineRating, type RatingProps as IMantineRatingProps } from '@mantine/core';
import type { OmitStyling } from '@/components/ui/types';
import styles from './Rating.module.scss';

export type IRatingProps = OmitStyling<IMantineRatingProps, 'color' | 'size'>;

export default function Rating({ ...props }: Readonly<IRatingProps>): React.ReactElement {
    return (
        <MantineRating
            size="md"
            classNames={{
                root: styles.rating,
                starSymbol: styles['rating__star'],
            }}
            {...props}
        />
    );
}
