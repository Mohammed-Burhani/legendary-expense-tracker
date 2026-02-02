# Legendary Builders - Expense Tracker

A comprehensive expense tracking application designed for construction companies to manage expenses, income, sites, managers, and laborers.

## Features

### Admin Dashboard
- **Overview of all sites** - View all construction sites with their status, location, and financial performance
- **Manager tracking** - Monitor each manager's income and expenses across their assigned sites
- **Site management** - Track active, completed, and on-hold projects
- **Laborer overview** - See all laborers across all sites
- **Financial analytics** - Comprehensive charts showing income vs expenses, category breakdowns, and site performance
- **Real-time statistics** - Total income, expenses, active sites, and laborer count

### Manager Dashboard
- **Site-specific tracking** - Each manager tracks expenses for their assigned site
- **Daily expense/income entry** - Add transactions with detailed categorization
- **Laborer management** - View and track payments to laborers
- **Category-based expenses** - Materials, Labor, Fuel, Equipment, Maintenance, Transport, Tools
- **Income tracking** - Client payments, advances, milestone payments
- **Transaction history** - Search and filter all transactions
- **Analytics** - Visual charts showing spending patterns and income trends

### Key Capabilities
- **Role-based access control** - Admin and Manager roles with different permissions
- **Site assignment** - Managers are assigned to specific construction sites
- **Laborer tracking** - Track individual laborer payments and work history
- **Transaction management** - Add, view, and delete expense/income entries
- **Advanced filtering** - Filter by type (income/expense), site, date, and search terms
- **Mobile-first design** - Optimized for mobile devices with touch-friendly UI
- **Data persistence** - Local storage for offline capability

## User Roles

### Admin
- View all sites, managers, and laborers
- Access comprehensive analytics across all sites
- Monitor manager performance
- Track site profitability

### Manager
- Add daily expenses and income for assigned site
- View site-specific laborers
- Track transaction history
- Access site-specific analytics
- Delete own transactions

## Technology Stack

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Forms**: Formik with Yup validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Default Users

The application comes with pre-configured users for testing:

1. **Admin** - Full access to all sites and data
2. **John Doe** (Manager) - Assigned to Downtown Plaza
3. **Jane Smith** (Manager) - Assigned to Riverside Apartments
4. **Mike Johnson** (Manager) - Assigned to Industrial Complex

Switch between users using the dropdown in the top-right corner.

## Application Structure

```
app/
├── page.tsx              # Dashboard (role-based)
├── add/page.tsx          # Add expense/income (managers only)
├── history/page.tsx      # Transaction history
├── analytics/page.tsx    # Financial analytics
├── laborers/page.tsx     # Laborer management (managers)
├── sites/page.tsx        # Site overview (admin)
└── layout.tsx            # Root layout

components/
├── layout/
│   ├── AppLayout.tsx     # Main layout wrapper
│   ├── Navbar.tsx        # Top navigation
│   └── MobileNav.tsx     # Bottom navigation
└── ui/                   # Reusable UI components

lib/
└── context.tsx           # Global state management
```

## Data Model

### User
- id, name, role (ADMIN/MANAGER/LABORER)
- siteId (for managers and laborers)
- managerId (for laborers)

### Site
- id, name, location
- managerId, status (ACTIVE/COMPLETED/ON_HOLD)

### Expense
- id, amount, description, category
- date, managerId, siteId
- type (EXPENSE/INCOME)
- laborerId (optional)

## Future Enhancements

- Backend integration with database
- User authentication
- Photo attachments for expenses
- PDF report generation
- Multi-currency support
- Expense approval workflow
- Budget tracking and alerts
- Time tracking for laborers
- Material inventory management

## License

Private - Legendary Builders
