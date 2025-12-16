export type Mentor = {
  id: number;
  name: string;
  rank: string;
  state: string;
  college: string;
  achievements: string[];
  speciality: string;
  imageUrl: string;
};

export const fetchMentors = async (): Promise<Mentor[]> => {
  try {
    const res = await fetch('http://localhost:5000/api/mentors');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Error fetching mentors:', error);
    throw error;
  }
};
