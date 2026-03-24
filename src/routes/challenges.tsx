import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Search, Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const LEETCODE_PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    acceptance: '52.4%',
    topic: 'Algorithms',
    type: 'Solo',
  },
  {
    id: 2,
    title: 'Add Two Numbers',
    difficulty: 'Medium',
    acceptance: '43.1%',
    topic: 'Linked List',
    type: '1v1',
  },
  {
    id: 3,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    acceptance: '34.8%',
    topic: 'Strings',
    type: 'Solo',
  },
  {
    id: 4,
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    acceptance: '39.7%',
    topic: 'Binary Search',
    type: 'Teams',
  },
  {
    id: 5,
    title: 'Longest Palindromic Substring',
    difficulty: 'Medium',
    acceptance: '33.9%',
    topic: 'Dynamic Programming',
    type: '1v1',
  },
  {
    id: 6,
    title: 'ZigZag Conversion',
    difficulty: 'Medium',
    acceptance: '48.2%',
    topic: 'Strings',
    type: 'Solo',
  },
  {
    id: 7,
    title: 'Reverse Integer',
    difficulty: 'Medium',
    acceptance: '28.5%',
    topic: 'Math',
    type: 'Solo',
  },
  {
    id: 8,
    title: 'String to Integer (atoi)',
    difficulty: 'Medium',
    acceptance: '17.3%',
    topic: 'Strings',
    type: 'Teams',
  },
  {
    id: 9,
    title: 'Palindrome Number',
    difficulty: 'Easy',
    acceptance: '56.1%',
    topic: 'Math',
    type: 'Solo',
  },
  {
    id: 10,
    title: 'Regular Expression Matching',
    difficulty: 'Hard',
    acceptance: '28.4%',
    topic: 'Recursion',
    type: 'Teams',
  },
  {
    id: 11,
    title: 'Container With Most Water',
    difficulty: 'Medium',
    acceptance: '55.0%',
    topic: 'Greedy',
    type: '1v1',
  },
  {
    id: 12,
    title: 'Integer to Roman',
    difficulty: 'Medium',
    acceptance: '65.1%',
    topic: 'Strings',
    type: 'Solo',
  },
  {
    id: 13,
    title: 'Roman to Integer',
    difficulty: 'Easy',
    acceptance: '61.3%',
    topic: 'Strings',
    type: 'Solo',
  },
  {
    id: 14,
    title: 'Longest Common Prefix',
    difficulty: 'Easy',
    acceptance: '43.2%',
    topic: 'Strings',
    type: 'Solo',
  },
  {
    id: 15,
    title: '3Sum',
    difficulty: 'Medium',
    acceptance: '34.5%',
    topic: 'Arrays',
    type: '1v1',
  },
  {
    id: 16,
    title: '3Sum Closest',
    difficulty: 'Medium',
    acceptance: '45.9%',
    topic: 'Arrays',
    type: 'Solo',
  },
  {
    id: 17,
    title: 'Letter Combinations of a Phone Number',
    difficulty: 'Medium',
    acceptance: '60.4%',
    topic: 'Backtracking',
    type: 'Solo',
  },
  {
    id: 18,
    title: '4Sum',
    difficulty: 'Medium',
    acceptance: '36.2%',
    topic: 'Arrays',
    type: '1v1',
  },
  {
    id: 19,
    title: 'Remove Nth Node From End of List',
    difficulty: 'Medium',
    acceptance: '44.6%',
    topic: 'Linked List',
    type: 'Solo',
  },
  {
    id: 20,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    acceptance: '40.5%',
    topic: 'Stacks',
    type: 'Solo',
  },
  {
    id: 21,
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    acceptance: '64.1%',
    topic: 'Linked List',
    type: 'Solo',
  },
  {
    id: 22,
    title: 'Generate Parentheses',
    difficulty: 'Medium',
    acceptance: '74.2%',
    topic: 'Backtracking',
    type: 'Teams',
  },
  {
    id: 23,
    title: 'Merge k Sorted Lists',
    difficulty: 'Hard',
    acceptance: '53.8%',
    topic: 'Heaps',
    type: 'Teams',
  },
  {
    id: 24,
    title: 'Swap Nodes in Pairs',
    difficulty: 'Medium',
    acceptance: '64.5%',
    topic: 'Linked List',
    type: '1v1',
  },
  {
    id: 25,
    title: 'Reverse Nodes in k-Group',
    difficulty: 'Hard',
    acceptance: '58.1%',
    topic: 'Linked List',
    type: 'Teams',
  },
  {
    id: 26,
    title: 'Remove Duplicates from Sorted Array',
    difficulty: 'Easy',
    acceptance: '55.8%',
    topic: 'Arrays',
    type: 'Solo',
  },
  {
    id: 27,
    title: 'Remove Element',
    difficulty: 'Easy',
    acceptance: '57.4%',
    topic: 'Arrays',
    type: 'Solo',
  },
  {
    id: 28,
    title: 'Find the Index of the First Occurrence in a String',
    difficulty: 'Easy',
    acceptance: '42.1%',
    topic: 'Strings',
    type: 'Solo',
  },
  {
    id: 29,
    title: 'Divide Two Integers',
    difficulty: 'Medium',
    acceptance: '17.8%',
    topic: 'Math',
    type: '1v1',
  },
  {
    id: 30,
    title: 'Substring with Concatenation of All Words',
    difficulty: 'Hard',
    acceptance: '32.1%',
    topic: 'Sliding Window',
    type: 'Teams',
  },
  {
    id: 31,
    title: 'Next Permutation',
    difficulty: 'Medium',
    acceptance: '39.5%',
    topic: 'Arrays',
    type: '1v1',
  },
  {
    id: 32,
    title: 'Longest Valid Parentheses',
    difficulty: 'Hard',
    acceptance: '33.8%',
    topic: 'Stacks',
    type: 'Teams',
  },
  {
    id: 33,
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    acceptance: '40.6%',
    topic: 'Binary Search',
    type: '1v1',
  },
  {
    id: 34,
    title: 'Find First and Last Position of Element in Sorted Array',
    difficulty: 'Medium',
    acceptance: '44.1%',
    topic: 'Binary Search',
    type: 'Solo',
  },
  {
    id: 35,
    title: 'Search Insert Position',
    difficulty: 'Easy',
    acceptance: '45.8%',
    topic: 'Binary Search',
    type: 'Solo',
  },
  {
    id: 36,
    title: 'Valid Sudoku',
    difficulty: 'Medium',
    acceptance: '60.2%',
    topic: 'Matrices',
    type: 'Solo',
  },
  {
    id: 37,
    title: 'Sudoku Solver',
    difficulty: 'Hard',
    acceptance: '61.3%',
    topic: 'Backtracking',
    type: 'Teams',
  },
  {
    id: 38,
    title: 'Count and Say',
    difficulty: 'Medium',
    acceptance: '55.4%',
    topic: 'Strings',
    type: 'Solo',
  },
  {
    id: 39,
    title: 'Combination Sum',
    difficulty: 'Medium',
    acceptance: '71.3%',
    topic: 'Backtracking',
    type: '1v1',
  },
  {
    id: 40,
    title: 'Combination Sum II',
    difficulty: 'Medium',
    acceptance: '54.8%',
    topic: 'Backtracking',
    type: '1v1',
  },
  {
    id: 41,
    title: 'First Missing Positive',
    difficulty: 'Hard',
    acceptance: '38.2%',
    topic: 'Arrays',
    type: 'Teams',
  },
  {
    id: 42,
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    acceptance: '62.1%',
    topic: 'Two Pointers',
    type: 'Teams',
  },
  {
    id: 43,
    title: 'Multiply Strings',
    difficulty: 'Medium',
    acceptance: '40.5%',
    topic: 'Math',
    type: 'Solo',
  },
  {
    id: 44,
    title: 'Wildcard Matching',
    difficulty: 'Hard',
    acceptance: '27.8%',
    topic: 'Dynamic Programming',
    type: 'Teams',
  },
  {
    id: 45,
    title: 'Jump Game II',
    difficulty: 'Medium',
    acceptance: '41.2%',
    topic: 'Greedy',
    type: '1v1',
  },
  {
    id: 46,
    title: 'Permutations',
    difficulty: 'Medium',
    acceptance: '78.4%',
    topic: 'Backtracking',
    type: 'Solo',
  },
  {
    id: 47,
    title: 'Permutations II',
    difficulty: 'Medium',
    acceptance: '59.2%',
    topic: 'Backtracking',
    type: 'Solo',
  },
  {
    id: 48,
    title: 'Rotate Image',
    difficulty: 'Medium',
    acceptance: '74.8%',
    topic: 'Matrices',
    type: '1v1',
  },
  {
    id: 49,
    title: 'Group Anagrams',
    difficulty: 'Medium',
    acceptance: '68.3%',
    topic: 'Hashing',
    type: 'Solo',
  },
  {
    id: 50,
    title: 'Pow(x, n)',
    difficulty: 'Medium',
    acceptance: '35.1%',
    topic: 'Math',
    type: 'Solo',
  },
]

const ITEMS_PER_PAGE = 10

export const Route = createFileRoute('/challenges')({
  component: RouteComponent,
})

function RouteComponent() {
  const [typeFilter, setTypeFilter] = useState('All')
  const [topicFilter, setTopicFilter] = useState('All Topics')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const topics = useMemo(
    () => ['All Topics', ...new Set(LEETCODE_PROBLEMS.map((p) => p.topic))],
    [],
  )

  const filteredData = LEETCODE_PROBLEMS.filter(
    (p) =>
      (typeFilter === 'All' || p.type === typeFilter) &&
      (topicFilter === 'All Topics' || p.topic === topicFilter) &&
      p.title.toLowerCase().includes(search.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="group relative overflow-hidden  border border-primary/20 hover:cursor-pointer select-none hover:shadow-2xl shadow-primary/5 transition-all group">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-background p-4 flex flex-col md:flex-row justify-between items-center gap-6 ">
            <div className="flex gap-6 items-center ">
              <div className="h-20 w-20  bg-primary/10 flex items-center justify-center border border-primary/20 relative p-2">
                <Flame className="text-primary w-full h-full animate-pulse opacity-15" />
                <h2 className="text-4xl absolute opacity-55">12</h2>
              </div>
              <div className="group-hover:text-primary ">
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 uppercase tracking-widest text-[10px]">
                  Daily Quest
                </Badge>
                <h2 className="text-3xl uppercase">#001: Two Sum</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Hard • Two Pointers •
                  <span className="text-primary">XP Reward: 150</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-card/30 p-4 border border-border">
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <Tabs
              defaultValue="All"
              onValueChange={(v) => {
                setTypeFilter(v)
                setCurrentPage(1)
              }}
            >
              <TabsList className="bg-background border border-border">
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Solo">Solo</TabsTrigger>
                <TabsTrigger value="1v1">1v1</TabsTrigger>
                <TabsTrigger value="Teams">Teams</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select
              onValueChange={(v) => {
                setTopicFilter(v)
                setCurrentPage(1)
              }}
              defaultValue="All Topics"
            >
              <SelectTrigger className="w-45 bg-background border-border">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {topics.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter problems..."
              className="pl-10 bg-background border-border"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>

        <div className=" border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-20 font-quantico text-xs uppercase text-muted-foreground px-6">
                  ID
                </TableHead>
                <TableHead className=" text-xs uppercase text-foreground">
                  Title
                </TableHead>
                <TableHead className=" text-xs uppercase text-muted-foreground">
                  Difficulty
                </TableHead>
                <TableHead className=" text-xs uppercase text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-right  text-xs uppercase text-muted-foreground px-6">
                  Acceptance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() =>
                    navigate({ to: '/challenge', search: { id: p.id } })
                  }
                  className="border-border hover:bg-primary/5 transition-colors group cursor-pointer h-16"
                >
                  <TableCell className="font-mono text-muted-foreground px-6">
                    #{p.id.toString().padStart(3, '0')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 font-bold group-hover:text-primary transition-colors">
                      {p.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${
                        p.difficulty === 'Easy'
                          ? 'text-emerald-500'
                          : p.difficulty === 'Medium'
                            ? 'text-amber-500'
                            : 'text-rarity-epic'
                      }`}
                    >
                      {p.difficulty}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] bg-muted/50 text-muted-foreground uppercase"
                    >
                      {p.topic}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground px-6">
                    <Progress value={parseFloat(p.acceptance)}></Progress>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <p className="text-xs text-muted-foreground font-mono">
            Showing {paginatedData.length} of {filteredData.length} challenges
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent className="">
              <PaginationItem>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-2 hover:text-primary disabled:opacity-30 flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
              </PaginationItem>

              <div className="flex gap-1 px-2">
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <Button
                      variant={'secondary'}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8  text-xs font-bold transition-all ${
                        currentPage === i + 1
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {i + 1}
                    </Button>
                  </PaginationItem>
                ))}
              </div>

              <PaginationItem>
                <Button
                  disabled={currentPage >= totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-2 hover:text-primary disabled:opacity-30 flex items-center gap-1 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
