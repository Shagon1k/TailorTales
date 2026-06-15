import Button from '@/components/ui/Button/Button';
import styles from './Pagination.module.scss';

export interface IPaginationProps {
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    page,
    total,
    pageSize,
    onPageChange,
}: Readonly<IPaginationProps>): React.ReactElement | null {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;

    return (
        <div className={styles.pagination}>
            <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                ← Prev
            </Button>
            <span className={styles.pagination__status}>
                Page {page} of {totalPages}
            </span>
            <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Next →
            </Button>
        </div>
    );
}
