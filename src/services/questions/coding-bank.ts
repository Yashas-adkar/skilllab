export interface CodingTestCase {
  input: any[];
  expectedOutput: any;
  displayInput: string;
  displayExpected: string;
  isHidden?: boolean;
}

export interface CodingProblem {
  id: string;
  streamId: 'cs_se' | 'ai_ml' | 'data_science' | 'all';
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  functionName: string;
  starterTemplates: Record<string, string>; // Minimal template without solution
  sampleTestCases: CodingTestCase[];
  hiddenTestCases: CodingTestCase[];
}

export const CODING_PROBLEMS_BANK: CodingProblem[] = [
  // Problem 1: Two Sum Lookup
  {
    id: 'code_cs_1',
    streamId: 'cs_se',
    title: 'Two Sum Target Lookup',
    difficulty: 'Easy',
    topic: 'Arrays & Hash Maps',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the indices in increasing order.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Exactly one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'nums[1] + nums[2] == 6, so indices [1, 2].',
      },
    ],
    functionName: 'twoSum',
    starterTemplates: {
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass
`,
      javascript: `function twoSum(nums, target) {
  // Write your solution here

}
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // Write your solution here

}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};
`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[0];
    }
}
`,
    },
    sampleTestCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expectedOutput: [0, 1],
        displayInput: 'nums = [2, 7, 11, 15], target = 9',
        displayExpected: '[0, 1]',
      },
      {
        input: [[3, 2, 4], 6],
        expectedOutput: [1, 2],
        displayInput: 'nums = [3, 2, 4], target = 6',
        displayExpected: '[1, 2]',
      },
    ],
    hiddenTestCases: [
      {
        input: [[3, 3], 6],
        expectedOutput: [0, 1],
        displayInput: 'nums = [3, 3], target = 6',
        displayExpected: '[0, 1]',
        isHidden: true,
      },
      {
        input: [[1, 5, 8, 12, 19, 25], 27],
        expectedOutput: [2, 4],
        displayInput: 'nums = [1, 5, 8, 12, 19, 25], target = 27',
        displayExpected: '[2, 4]',
        isHidden: true,
      },
      {
        input: [[-3, 4, 3, 90], 0],
        expectedOutput: [0, 2],
        displayInput: 'nums = [-3, 4, 3, 90], target = 0',
        displayExpected: '[0, 2]',
        isHidden: true,
      },
    ],
  },

  // Problem 2: Valid Palindrome String
  {
    id: 'code_cs_2',
    streamId: 'cs_se',
    title: 'Valid Palindrome String',
    difficulty: 'Easy',
    topic: 'Strings & Two Pointers',
    description:
      'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string s, return true if it is a palindrome, or false otherwise.',
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.',
    ],
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.',
      },
    ],
    functionName: 'isPalindrome',
    starterTemplates: {
      python: `def isPalindrome(s: str) -> bool:
    # Write your solution here
    pass
`,
      javascript: `function isPalindrome(s) {
  // Write your solution here

}
`,
      typescript: `function isPalindrome(s: string): boolean {
  // Write your solution here

}
`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        // Write your solution here
        return false;
    }
};
`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        // Write your solution here
        return false;
    }
}
`,
    },
    sampleTestCases: [
      {
        input: ['A man, a plan, a canal: Panama'],
        expectedOutput: true,
        displayInput: 's = "A man, a plan, a canal: Panama"',
        displayExpected: 'true',
      },
      {
        input: ['race a car'],
        expectedOutput: false,
        displayInput: 's = "race a car"',
        displayExpected: 'false',
      },
    ],
    hiddenTestCases: [
      {
        input: [' '],
        expectedOutput: true,
        displayInput: 's = " "',
        displayExpected: 'true',
        isHidden: true,
      },
      {
        input: ['0P'],
        expectedOutput: false,
        displayInput: 's = "0P"',
        displayExpected: 'false',
        isHidden: true,
      },
      {
        input: ['Was it a car or a cat I saw?'],
        expectedOutput: true,
        displayInput: 's = "Was it a car or a cat I saw?"',
        displayExpected: 'true',
        isHidden: true,
      },
    ],
  },

  // Problem 3: Search in Sorted Array (Binary Search)
  {
    id: 'code_cs_3',
    streamId: 'cs_se',
    title: 'Binary Search Element Index',
    difficulty: 'Medium',
    topic: 'Searching & Sorting',
    description:
      'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.',
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All the integers in nums are unique.',
      'nums is sorted in ascending order.',
    ],
    examples: [
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4',
      },
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1',
      },
    ],
    functionName: 'search',
    starterTemplates: {
      python: `def search(nums: list[int], target: int) -> int:
    # Write your solution here
    pass
`,
      javascript: `function search(nums, target) {
  // Write your solution here

}
`,
      typescript: `function search(nums: number[], target: number): number[] {
  // Write your solution here

}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Write your solution here
        return -1;
    }
};
`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        // Write your solution here
        return -1;
    }
}
`,
    },
    sampleTestCases: [
      {
        input: [[-1, 0, 3, 5, 9, 12], 9],
        expectedOutput: 4,
        displayInput: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        displayExpected: '4',
      },
      {
        input: [[-1, 0, 3, 5, 9, 12], 2],
        expectedOutput: -1,
        displayInput: 'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        displayExpected: '-1',
      },
    ],
    hiddenTestCases: [
      {
        input: [[5], 5],
        expectedOutput: 0,
        displayInput: 'nums = [5], target = 5',
        displayExpected: '0',
        isHidden: true,
      },
      {
        input: [[1, 3, 5, 7, 9, 11, 13], 13],
        expectedOutput: 6,
        displayInput: 'nums = [1, 3, 5, 7, 9, 11, 13], target = 13',
        displayExpected: '6',
        isHidden: true,
      },
      {
        input: [[2, 4, 6, 8, 10], 1],
        expectedOutput: -1,
        displayInput: 'nums = [2, 4, 6, 8, 10], target = 1',
        displayExpected: '-1',
        isHidden: true,
      },
    ],
  },

  // Problem 4: Maximum Subarray Sum (Kadane's Algorithm)
  {
    id: 'code_cs_4',
    streamId: 'cs_se',
    title: 'Maximum Subarray Sum',
    difficulty: 'Medium',
    topic: 'Dynamic Programming & Loops',
    description:
      'Given an integer array nums, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    examples: [
      {
        input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        output: '6',
        explanation: 'The subarray [4, -1, 2, 1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
      {
        input: 'nums = [5, 4, -1, 7, 8]',
        output: '23',
        explanation: 'The subarray [5, 4, -1, 7, 8] has the largest sum 23.',
      },
    ],
    functionName: 'maxSubArray',
    starterTemplates: {
      python: `def maxSubArray(nums: list[int]) -> int:
    # Write your solution here
    pass
`,
      javascript: `function maxSubArray(nums) {
  // Write your solution here

}
`,
      typescript: `function maxSubArray(nums: number[]): number {
  // Write your solution here

}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};
`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your solution here
        return 0;
    }
}
`,
    },
    sampleTestCases: [
      {
        input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]],
        expectedOutput: 6,
        displayInput: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        displayExpected: '6',
      },
      {
        input: [[5, 4, -1, 7, 8]],
        expectedOutput: 23,
        displayInput: 'nums = [5, 4, -1, 7, 8]',
        displayExpected: '23',
      },
    ],
    hiddenTestCases: [
      {
        input: [[-1]],
        expectedOutput: -1,
        displayInput: 'nums = [-1]',
        displayExpected: '-1',
        isHidden: true,
      },
      {
        input: [[-2, -1]],
        expectedOutput: -1,
        displayInput: 'nums = [-2, -1]',
        displayExpected: '-1',
        isHidden: true,
      },
      {
        input: [[3, -2, 5, -1]],
        expectedOutput: 6,
        displayInput: 'nums = [3, -2, 5, -1]',
        displayExpected: '6',
        isHidden: true,
      },
    ],
  },

  // Problem 5: Valid Parentheses String
  {
    id: 'code_cs_5',
    streamId: 'cs_se',
    title: 'Valid Parentheses Balancing',
    difficulty: 'Medium',
    topic: 'Data Structures & Stacks',
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order, with every close bracket having a corresponding open bracket.',
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}".',
    ],
    examples: [
      {
        input: 's = "()"',
        output: 'true',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
      {
        input: 's = "(]"',
        output: 'false',
      },
    ],
    functionName: 'isValid',
    starterTemplates: {
      python: `def isValid(s: str) -> bool:
    # Write your solution here
    pass
`,
      javascript: `function isValid(s) {
  // Write your solution here

}
`,
      typescript: `function isValid(s: string): boolean {
  // Write your solution here

}
`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        return false;
    }
};
`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}
`,
    },
    sampleTestCases: [
      {
        input: ['()[]{}'],
        expectedOutput: true,
        displayInput: 's = "()[]{}"',
        displayExpected: 'true',
      },
      {
        input: ['(]'],
        expectedOutput: false,
        displayInput: 's = "(]"',
        displayExpected: 'false',
      },
    ],
    hiddenTestCases: [
      {
        input: ['{[]}'],
        expectedOutput: true,
        displayInput: 's = "{[]}"',
        displayExpected: 'true',
        isHidden: true,
      },
      {
        input: ['['],
        expectedOutput: false,
        displayInput: 's = "["',
        displayExpected: 'false',
        isHidden: true,
      },
      {
        input: [']'],
        expectedOutput: false,
        displayInput: 's = "]"',
        displayExpected: 'false',
        isHidden: true,
      },
    ],
  },
];

/**
 * Retrieve 5 coding problems for the specified career stream
 */
export function getCodingProblemsForStream(streamId: string): CodingProblem[] {
  // If specific stream problems exist, prioritize them, then fill with general problems
  const streamProblems = CODING_PROBLEMS_BANK.filter(
    (p) => p.streamId === streamId || p.streamId === 'all' || p.streamId === 'cs_se'
  );

  return streamProblems.slice(0, 5);
}

export function getCodingProblemById(id: string): CodingProblem | undefined {
  return CODING_PROBLEMS_BANK.find((p) => p.id === id);
}
