import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Mortgage } from "@shared/schema";

/**
 * Simple component for testing mortgage-related functionality.
 * This component will display the current mortgages and log them to the console.
 */
export default function MortgageTest() {
  const [mortgageIds, setMortgageIds] = useState<number[]>([]);
  
  // Fetch mortgages
  const { data: mortgages, isLoading } = useQuery<Mortgage[]>({
    queryKey: ["/api/mortgages"],
    staleTime: 60000, // 1 minute
    refetchInterval: 5000, // Refetch every 5 seconds to detect changes
  });

  useEffect(() => {
    if (mortgages && mortgages.length > 0) {
      console.log("TEST: Current mortgages:", mortgages);
      console.log("TEST: Number of mortgages:", mortgages.length);
      
      // Track changes in mortgage IDs
      const ids = mortgages.map(m => m.id);
      setMortgageIds(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(ids)) {
          console.log("TEST: Mortgage IDs changed from", prev, "to", ids);
        }
        return ids;
      });
    }
  }, [mortgages]);

  if (isLoading) {
    return <div>Loading test data...</div>;
  }

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', border: '1px solid #ccc', marginTop: '20px' }}>
      <h2>Mortgage Test Component</h2>
      <p>Number of mortgages: {mortgages?.length || 0}</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Name</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Balance</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Interest Rate</th>
          </tr>
        </thead>
        <tbody>
          {mortgages && mortgages.map(mortgage => (
            <tr key={mortgage.id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{mortgage.id}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{mortgage.name}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>${mortgage.mortgageBalance}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{mortgage.interestRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}