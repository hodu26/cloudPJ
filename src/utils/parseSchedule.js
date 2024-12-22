/**
 * 스케줄 문자열을 파싱하여 시간표 객체 배열로 변환
 */
export const parseSchedule = (scheduleString) => {
    const timeMapping = {
        '0-A': { start: '08:00', end: '08:30' },
        '0-B': { start: '08:30', end: '09:00' },
        '1-A': { start: '09:00', end: '09:30' },
        '1-B': { start: '09:30', end: '10:00' },
        '2-A': { start: '10:00', end: '10:30' },
        '2-B': { start: '10:30', end: '11:00' },
        '3-A': { start: '11:00', end: '11:30' },
        '3-B': { start: '11:30', end: '12:00' },
        '4-A': { start: '12:00', end: '12:30' },
        '4-B': { start: '12:30', end: '13:00' },
        '5-A': { start: '13:00', end: '13:30' },
        '5-B': { start: '13:30', end: '14:00' },
        '6-A': { start: '14:00', end: '14:30' },
        '6-B': { start: '14:30', end: '15:00' },
        '7-A': { start: '15:00', end: '15:30' },
        '7-B': { start: '15:30', end: '16:00' },
        '8-A': { start: '16:00', end: '16:30' },
        '8-B': { start: '16:30', end: '17:00' },
        '9-A': { start: '17:00', end: '17:30' },
        '9-B': { start: '17:30', end: '18:00' },
        '10-A': { start: '18:00', end: '18:30' },
        '10-B': { start: '18:30', end: '19:00' },
        '11-A': { start: '19:00', end: '19:30' },
        '11-B': { start: '19:30', end: '20:00' },
        '12-A': { start: '20:00', end: '20:30' },
        '12-B': { start: '20:30', end: '21:00' },
        '13-A': { start: '21:00', end: '21:30' },
        '13-B': { start: '21:30', end: '22:00' },
        '14-A': { start: '22:00', end: '22:30' },
        '14-B': { start: '22:30', end: '23:00' },
        '15-A': { start: '23:00', end: '23:30' },
        '15-B': { start: '23:30', end: '24:00' },
      };
    
      // 데이터 유효성 검증
      if (!scheduleString || typeof scheduleString !== 'string') {
        console.error('Invalid scheduleString:', scheduleString);
        return [];
      }
    
      // 초기 변환
      const scheduleArray = scheduleString.split(',').map((slot) => {
        const [day, period] = slot.trim().split(' ');
    
        // `timeMapping`에서 값 찾기
        const time = timeMapping[period];
        if (!time) {
          console.error(`Invalid period '${period}' in schedule:`, slot);
          return null;
        }
    
        return {
          day,
          startTime: time.start,
          endTime: time.end,
        };
      }).filter(Boolean); // `null` 값 제거
    
      // 연속된 시간 합치기
      const mergedSchedule = [];
      for (const current of scheduleArray) {
        const last = mergedSchedule[mergedSchedule.length - 1];
    
        // 마지막 항목과 같은 요일이며 시간이 연속될 경우 합침
        if (
          last &&
          last.day === current.day &&
          last.endTime === current.startTime // 연속된 시간 확인
        ) {
          last.endTime = current.endTime; // `endTime` 업데이트
        } else {
          mergedSchedule.push(current); // 새로운 항목 추가
        }
      }
    
      return mergedSchedule;
    };