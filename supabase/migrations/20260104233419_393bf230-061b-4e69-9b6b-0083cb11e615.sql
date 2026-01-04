-- Create function to notify owner when room reaches full capacity
CREATE OR REPLACE FUNCTION notify_owner_room_full()
RETURNS TRIGGER AS $$
DECLARE
  dorm_record RECORD;
BEGIN
  -- Only trigger when capacity_occupied changes and room becomes full
  IF NEW.capacity_occupied >= NEW.capacity 
     AND (OLD.capacity_occupied IS NULL OR OLD.capacity_occupied < OLD.capacity) THEN
    
    -- Get dorm and owner info
    SELECT d.id, d.name, d.dorm_name, d.owner_id 
    INTO dorm_record
    FROM dorms d 
    WHERE d.id = NEW.dorm_id;
    
    IF dorm_record.owner_id IS NOT NULL THEN
      -- Insert notification for owner
      INSERT INTO owner_notifications (
        owner_id,
        dorm_id,
        title,
        body,
        read
      ) VALUES (
        dorm_record.owner_id,
        NEW.dorm_id,
        'Room Full: ' || NEW.name,
        'Room "' || NEW.name || '" in ' || COALESCE(dorm_record.dorm_name, dorm_record.name) || ' has reached full capacity (' || NEW.capacity_occupied || '/' || NEW.capacity || '). Consider marking it as unavailable.',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS room_full_notification_trigger ON rooms;
CREATE TRIGGER room_full_notification_trigger
  AFTER UPDATE OF capacity_occupied ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_room_full();