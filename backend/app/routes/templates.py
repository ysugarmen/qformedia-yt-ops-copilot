from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.template import Template
from app.schemas import TemplateCreate, TemplateUpdate

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("")
def list_templates(session: Session = Depends(get_session)):
    templates = session.exec(select(Template).order_by(Template.created_at.desc())).all()
    return {
        "templates": templates
    }


@router.post("", status_code=201, response_model=TemplateCreate)
def create_template(payload: TemplateCreate, session: Session = Depends(get_session)):
    temp = Template(name=payload.name, kind=payload.kind, content=payload.content)
    session.add(temp)
    session.commit()
    session.refresh(temp)
    return temp


@router.get("/{template_id}")
def get_template(template_id: int, session: Session = Depends(get_session)):
    temp = session.get(Template, template_id)
    if not temp:
        raise HTTPException(status_code=404, detail="Template not found")
    return temp


@router.put("/{template_id}")
def update_template(template_id: int, payload: TemplateUpdate, session: Session = Depends(get_session)):
    temp = session.get(Template, template_id)
    if not temp:
        raise HTTPException(status_code=404, detail="Template not found")
    
    temp.name = payload.name
    temp.kind = payload.kind
    temp.content = payload.content

    session.add(temp)
    session.commit()
    session.refresh(temp)

    return temp


@router.delete("/{template_id}")
def delete_template(template_id: int, session: Session = Depends(get_session)):
    t = session.get(Template, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    session.delete(t)
    session.commit()
    return {"ok": True}