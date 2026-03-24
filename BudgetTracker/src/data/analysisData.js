export const analysisReports = [
    {
        id: 1,
        period: 'October 2023',
        type: 'monthly',
        score: 78,
        summary: "You've stayed within budget overall, but dining out expenses are trending 15% higher than last month. Good job on saving towards your laptop goal!",
        insights: [
            { type: 'warning', text: 'Dining out is $45 over the recommended limit.' },
            { type: 'success', text: 'Utility bills were 10% lower than expected.' },
            { type: 'info', text: 'Subscription renewal for "Netflix" is coming up next week.' }
        ],
        recommendations: [
            "Cook at home 2 more times this week to offset the dining overage.",
            "Move the $20 saved from utilities directly to your investments."
        ],
        dateGenerated: '2023-11-01'
    },
    {
        id: 2,
        period: 'September 2023',
        type: 'monthly',
        score: 85,
        summary: "Excellent month! You hit all your savings targets and kept discretionary spending low. Your emergency fund has grown by 5% this month.",
        insights: [
            { type: 'success', text: 'Saved $200 more than planned!' },
            { type: 'success', text: 'Groceries came in under budget by $30.' },
            { type: 'info', text: 'Car insurance payment processed successfully.' }
        ],
        recommendations: [
            "Consider increasing your monthly investment limit by $50.",
            "Reward yourself with a small treat for hitting your goals!"
        ],
        dateGenerated: '2023-10-01'
    },
    {
        id: 3,
        period: 'Week 42 (Oct 16 - Oct 22)',
        type: 'weekly',
        score: 65,
        summary: "A bit of a heavy spending week due to the unplanned car repair. This has impacted your 'Emergency Fund' but that's what it's there for.",
        insights: [
            { type: 'alert', text: 'Emergency Withdrawal: $450 for car repair.' },
            { type: 'warning', text: 'Entertainment budget exceeded by $20.' },
            { type: 'info', text: 'Weekly grocery run pending.' }
        ],
        recommendations: [
            "Pause 'Entertainment' spending for the rest of the month.",
            "Review car insurance policy for potential savings."
        ],
        dateGenerated: '2023-10-23'
    },
    {
        id: 4,
        period: 'Week 41 (Oct 09 - Oct 15)',
        type: 'weekly',
        score: 92,
        summary: "Flawless execution this week. Zero impulse purchases detected and all bills paid on time.",
        insights: [
            { type: 'success', text: 'No "Misc" category spending.' },
            { type: 'success', text: 'Transport costs minimal (remote work week).' }
        ],
        recommendations: [
            "Keep up the momentum!",
            "Check if any upcoming birthdays require a gift budget."
        ],
        dateGenerated: '2023-10-16'
    }
];
