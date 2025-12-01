import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useFriendships } from '@/hooks/useFriendships';
import { useFriendSuggestions } from '@/hooks/useFriendSuggestions';
import { FriendRequestCard } from './FriendRequestCard';
import { FriendCard } from './FriendCard';
import { SuggestionCard } from './SuggestionCard';
import { MutualFriendsModal } from './MutualFriendsModal';
import { Users, UserPlus, Sparkles, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createOrGetConversation } from '@/lib/conversationUtils';
import { supabase } from '@/integrations/supabase/client';

interface FriendsTabProps {
  studentId: string;
  searchQuery?: string;
}

interface StudentDirectory {
  id: string;
  full_name: string;
  username: string | null;
  university: string | null;
  major: string | null;
  year_of_study: number | null;
  profile_photo_url: string | null;
  current_dorm_id: string | null;
  mutual_friends_count: number;
  match_reason: 'same_dorm' | 'same_university' | 'same_major';
}

export function FriendsTab({ studentId, searchQuery = '' }: FriendsTabProps) {
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading: friendsLoading,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    sendRequest,
  } = useFriendships(studentId);

  const { suggestions, loading: suggestionsLoading } =
    useFriendSuggestions(studentId);

  const [mutualFriendsModal, setMutualFriendsModal] = useState<{
    open: boolean;
    studentIdA: string;
    studentIdB: string;
  }>({
    open: false,
    studentIdA: '',
    studentIdB: '',
  });

  // Student directory search results
  const [studentDirectoryResults, setStudentDirectoryResults] = useState<StudentDirectory[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Search student directory when query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setStudentDirectoryResults([]);
      return;
    }

    const searchStudentDirectory = async () => {
      setDirectoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name, username, university, major, year_of_study, profile_photo_url, current_dorm_id')
          .neq('id', studentId) // Exclude self
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,university.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        
        // Map to include required fields for SuggestionCard
        const mappedResults: StudentDirectory[] = (data || []).map(student => ({
          ...student,
          current_dorm_id: student.current_dorm_id || null,
          mutual_friends_count: 0, // Will be calculated if needed
          match_reason: 'same_university' as const, // Default reason
        }));
        
        setStudentDirectoryResults(mappedResults);
      } catch (error) {
        console.error('Error searching student directory:', error);
      } finally {
        setDirectoryLoading(false);
      }
    };

    const debounce = setTimeout(searchStudentDirectory, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, studentId]);

  // Filter based on search query
  const filteredRequests = pendingRequests.filter(fr =>
    fr.requester?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fr.requester?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(fr => {
    const friend = fr.requester_id === studentId ? fr.receiver : fr.requester;
    return (
      friend?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend?.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend?.major?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredSuggestions = suggestions.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.major?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessage = async (friendStudentId: string) => {
    // Get user IDs from student IDs
    const { data: currentUser } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    const { data: friendUser } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', friendStudentId)
      .single();

    if (currentUser && friendUser) {
      const conversationId = await createOrGetConversation(
        currentUser.user_id,
        friendUser.user_id
      );
      navigate(`/messages?conversation=${conversationId}`);
    }
  };

  const handleViewProfile = (friendStudentId: string) => {
    navigate(`/roommate-profile/${friendStudentId}`);
  };

  const handleAccept = async (friendshipId: string) => {
    await acceptRequest(friendshipId);
  };

  const handleMutualFriendsClick = (idA: string, idB: string) => {
    setMutualFriendsModal({ open: true, studentIdA: idA, studentIdB: idB });
  };

  const isRequestSent = (suggestionId: string) => {
    return sentRequests.some(
      fr => fr.receiver_id === suggestionId
    );
  };

  if (friendsLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // When searching, show directory results
  const showDirectoryResults = searchQuery && searchQuery.length >= 2;

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Student Directory Search Results */}
          {showDirectoryResults && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SearchIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Search Results</h3>
                {directoryLoading && <span className="text-sm text-muted-foreground">(searching...)</span>}
              </div>
              {directoryLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : studentDirectoryResults.length > 0 ? (
                <div className="space-y-3">
                  {studentDirectoryResults.map(student => (
                    <SuggestionCard
                      key={student.id}
                      suggestion={student}
                      currentStudentId={studentId}
                      onAddFriend={sendRequest}
                      onMutualFriendsClick={handleMutualFriendsClick}
                      isRequestSent={isRequestSent(student.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No students found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {/* Friend Requests Section */}
          {!showDirectoryResults && filteredRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Friend Requests</h3>
                <span className="text-sm text-muted-foreground">
                  ({filteredRequests.length})
                </span>
              </div>
              <div className="space-y-3">
                {filteredRequests.map(friendship => (
                  <FriendRequestCard
                    key={friendship.id}
                    friendship={friendship}
                    currentStudentId={studentId}
                    onAccept={handleAccept}
                    onReject={rejectRequest}
                    onMutualFriendsClick={handleMutualFriendsClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Your Friends Section */}
          {!showDirectoryResults && filteredFriends.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Your Friends</h3>
                <span className="text-sm text-muted-foreground">
                  ({filteredFriends.length})
                </span>
              </div>
              <div className="space-y-3">
                {filteredFriends.map(friendship => (
                  <FriendCard
                    key={friendship.id}
                    friendship={friendship}
                    currentStudentId={studentId}
                    onMessage={handleMessage}
                    onRemove={removeFriend}
                    onBlock={blockUser}
                    onViewProfile={handleViewProfile}
                    onMutualFriendsClick={handleMutualFriendsClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions Section */}
          {!showDirectoryResults && filteredSuggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">People You May Know</h3>
              </div>
              {suggestionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSuggestions.map(suggestion => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      currentStudentId={studentId}
                      onAddFriend={sendRequest}
                      onMutualFriendsClick={handleMutualFriendsClick}
                      isRequestSent={isRequestSent(suggestion.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!showDirectoryResults &&
            filteredRequests.length === 0 &&
            filteredFriends.length === 0 &&
            filteredSuggestions.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Start connecting with other students!'}
                </p>
              </div>
            )}
        </div>
      </ScrollArea>

      <MutualFriendsModal
        open={mutualFriendsModal.open}
        onOpenChange={open =>
          setMutualFriendsModal(prev => ({ ...prev, open }))
        }
        studentIdA={mutualFriendsModal.studentIdA}
        studentIdB={mutualFriendsModal.studentIdB}
      />
    </>
  );
}
