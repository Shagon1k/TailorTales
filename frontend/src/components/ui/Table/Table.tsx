import styles from './Table.module.scss';

function TableRoot({ children }: { children: React.ReactNode }): React.ReactElement {
    return <table className={styles.table}>{children}</table>;
}

function TableHead({ children }: { children?: React.ReactNode }): React.ReactElement {
    return <thead>{children}</thead>;
}

function TableBody({ children }: { children?: React.ReactNode }): React.ReactElement {
    return <tbody>{children}</tbody>;
}

function TableRow({ children }: { children: React.ReactNode }): React.ReactElement {
    return <tr className={styles.table__row}>{children}</tr>;
}

function TableHeaderCell({ children }: { children: React.ReactNode }): React.ReactElement {
    return <th className={styles.table__th}>{children}</th>;
}

function TableCell({ children }: { children: React.ReactNode }): React.ReactElement {
    return <td className={styles.table__td}>{children}</td>;
}

const Table = Object.assign(TableRoot, {
    Head: TableHead,
    Body: TableBody,
    Row: TableRow,
    HeaderCell: TableHeaderCell,
    Cell: TableCell,
});

export default Table;
