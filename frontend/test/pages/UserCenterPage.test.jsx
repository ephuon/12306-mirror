import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserCenterPage from '../../src/pages/UserCenterPage';
import PersonalInfo from '../../src/pages/center/PersonalInfo';
import PassengerList from '../../src/pages/center/PassengerList';

// Mock Header and Navbar to avoid clutter
vi.mock('../../src/components/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../../src/components/Navbar', () => ({ default: () => <div data-testid="navbar">Navbar</div> }));

describe('UserCenterPage', () => {
    it('renders layout with sidebar and links', () => {
        render(
            <MemoryRouter initialEntries={['/center']}>
                <Routes>
                    <Route path="/center" element={<UserCenterPage />}>
                        <Route path="personal" element={<PersonalInfo />} />
                        <Route path="passengers" element={<PassengerList />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByText('个人中心')).toBeInTheDocument();
        expect(screen.getByText('查看个人信息')).toBeInTheDocument();
        expect(screen.getByText('乘车人管理')).toBeInTheDocument();
    });

    it('navigates to personal info', () => {
        render(
            <MemoryRouter initialEntries={['/center/personal']}>
                 <Routes>
                    <Route path="/center" element={<UserCenterPage />}>
                        <Route path="personal" element={<PersonalInfo />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText('这里是个人信息页面。')).toBeInTheDocument();
    });

    it('navigates to passengers', () => {
        render(
            <MemoryRouter initialEntries={['/center/passengers']}>
                 <Routes>
                    <Route path="/center" element={<UserCenterPage />}>
                        <Route path="passengers" element={<PassengerList />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText('这里是乘车人列表。')).toBeInTheDocument();
    });
});
