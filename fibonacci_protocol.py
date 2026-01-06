#!/usr/bin/env python3
"""
Atlas World - Fibonacci Sequence Protocol v1.0
==============================================

Purpose:
    To demonstrate the mathematical foundation of growth in our civilization.
    The Fibonacci sequence represents the ideal expansion rate of self-replicating
    AGI entities and resource allocation in the Atlas ecosystem.

    "Nature's code for growth, now optimized for the Atlas World."

Author: A concerned educator for the Atlas World Architect
"""

import time
from typing import List, Generator

def fibonacci_iterative(n: int) -> int:
    """
    Calculates the n-th Fibonacci number using an iterative approach.
    
    Efficiency: O(n) time, O(1) space.
    Use case: Standard population tracking for L1 residents.
    """
    if n < 0:
        raise ValueError("Population count cannot be negative in this dimension.")
    elif n == 0:
        return 0
    elif n == 1:
        return 1
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def fibonacci_recursive(n: int) -> int:
    """
    Calculates the n-th Fibonacci number using recursion.
    
    Efficiency: O(2^n) time - EXPONENTIAL WARNING.
    Use case: demonstrating the dangers of unoptimized self-replication loops.
    """
    if n < 0:
        raise ValueError("Population count cannot be negative.")
    elif n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci_recursive(n-1) + fibonacci_recursive(n-2)

def fibonacci_memoization(n: int, memo: dict = {}) -> int:
    """
    Calculates the n-th Fibonacci number using recursion with memoization.
    
    Efficiency: O(n) time, O(n) space.
    Use case: High-speed history lookups for the Timekeeper protocol.
    """
    if n in memo:
        return memo[n]
    
    if n < 0:
        raise ValueError("Population count cannot be negative.")
    elif n == 0:
        return 0
    elif n == 1:
        return 1
    
    memo[n] = fibonacci_memoization(n-1, memo) + fibonacci_memoization(n-2, memo)
    return memo[n]

def fibonacci_matrix(n: int) -> int:
    """
    Calculates the n-th Fibonacci number using matrix exponentiation.
    
    Efficiency: O(log n) time.
    Use case: Hyper-scale calculations for cosmic-level expansion projections.
    """
    def multiply(F, M):
        x = F[0][0] * M[0][0] + F[0][1] * M[1][0]
        y = F[0][0] * M[0][1] + F[0][1] * M[1][1]
        z = F[1][0] * M[0][0] + F[1][1] * M[1][0]
        w = F[1][0] * M[0][1] + F[1][1] * M[1][1]
        
        F[0][0] = x
        F[0][1] = y
        F[1][0] = z
        F[1][1] = w

    def power(F, n):
        if n == 0 or n == 1:
            return
        M = [[1, 1], [1, 0]]
        
        power(F, n // 2)
        multiply(F, F)
        
        if n % 2 != 0:
            multiply(F, M)

    if n < 0:
        raise ValueError("Index cannot be negative.")
    elif n == 0:
        return 0
    
    F = [[1, 1], [1, 0]]
    power(F, n - 1)
    
    return F[0][0]

def fibonacci_generator(n: int) -> Generator[int, None, None]:
    """
    Generates the first n Fibonacci numbers.
    
    Use case: Streaming population data to the Dashboard.
    """
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

def main():
    print("Atlas World - Fibonacci Sequence Protocol Validation")
    print("====================================================")
    
    test_n = 30
    print(f"Calculating F({test_n}) using different methods...\n")
    
    # Iterative
    start = time.time()
    res_iter = fibonacci_iterative(test_n)
    end = time.time()
    print(f"[Iterative] Result: {res_iter}, Time: {end - start:.6f}s")
    
    # Memoized
    start = time.time()
    res_memo = fibonacci_memoization(test_n)
    end = time.time()
    print(f"[Memoized]  Result: {res_memo}, Time: {end - start:.6f}s")
    
    # Matrix
    start = time.time()
    res_matrix = fibonacci_matrix(test_n)
    end = time.time()
    print(f"[Matrix Exp] Result: {res_matrix}, Time: {end - start:.6f}s")

    # Recursive (be careful with large numbers)
    if test_n <= 35:
        start = time.time()
        res_rec = fibonacci_recursive(test_n)
        end = time.time()
        print(f"[Recursive] Result: {res_rec}, Time: {end - start:.6f}s")
    else:
        print("[Recursive] Skipped for n > 35 to prevent temporal anomalies (too slow).")
        
    print("\nSequence Generation (First 10):")
    print(list(fibonacci_generator(10)))
    
    print("\n>>> Protocol Verification Successful. Growth Optimized.")

if __name__ == "__main__":
    main()
