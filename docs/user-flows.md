# User flows

The main scenarios at a high level. Whoever implements a step owns its detailed flow and screens. Prototype screens on mock data are under `/preview` (development only).

## Teacher

1. Register and log in as a teacher (#7), edit the profile (#8).
2. Create a class (#9) and invite students with a code or link (#10).
3. Create an assignment (#11) with grading criteria and assign it to the class (#12).
4. Upload photos, scans or PDFs of student work (#13), one by one or in bulk (#21), and assign each to a student (#14). Prototype: `/preview/teacher/assignments/a1/upload`.
5. The system recognizes the text (#22) and AI suggests points, feedback and uncertain parts (#24). Grading can be run again (#25).
6. Review the work next to the AI suggestion (#26), fix points, feedback or recognized text (#27), then approve or reject (#28). Prototype: `/preview/teacher/submissions/s1`.
7. Publish approved results to students (#29).
8. Handle appeals (#32). Every change is kept in the history (#33).

## Student

1. Register and log in as a student (#7), join a class with the code (#10).
2. Get notified when a result is published (#31).
3. See the results overview and the feedback for each assignment (#30). Prototype: `/preview/student` and `/preview/student/results/s2`.
4. File an appeal against a result (#32) and get notified when it is resolved (#31).
