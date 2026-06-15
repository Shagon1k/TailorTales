import { render, screen } from '@testing-library/react';
import Table from '../Table';

describe('Table', () => {
    describe('Table.HeaderCell', () => {
        it('should render a column header', () => {
            render(
                <Table>
                    <Table.Head>
                        <Table.Row>
                            <Table.HeaderCell>Name</Table.HeaderCell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body />
                </Table>,
            );

            expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        });
    });

    describe('Table.Cell', () => {
        it('should render a data cell', () => {
            render(
                <Table>
                    <Table.Head />
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>Alice</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>,
            );

            expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
        });
    });
});
